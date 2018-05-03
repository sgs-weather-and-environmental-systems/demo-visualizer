/*******************************************************************************
 * Copyright (c) 2015 Texas Instruments and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: Paul Gingrich - Initial API and implementation
 ******************************************************************************/
var gc = gc || {};
gc.databind = gc.databind || {};

(function()
{
    var IDLE = 0;
    var READ = 1;
    var WRITE = 2;
    var DELAYED_WRITE = 3;
    var DELAYED_READ = 4;
    var ERROR_STATE = 99;
    var nullProgressCounter = new gc.databind.IProgressCounter();

    // qualifiers
    var READONLY = 'readonly'; // do not write to target, and therefore no need
    // to read back the value.
    var WRITEONLY = 'writeonly'; // only write to target, do not read
    var NONVOLATILE = 'nonvolatile'; // no need to poll the target for
    // changes
    var CONST = 'const'; // no polling or writing to the target.

    /**
     * Abstract class that implements IBindValue interface for clients that need
     * asynchronous access to values for the purposes of reading and writing.
     * This class assumes polling is required to read the value. If this is not
     * the case, you probably do not need to derive from this abstract class.
     * This class implements a IDLE/READ/WRITE/DELAYED_WRITE state machine to
     * keep reads and write synchronous and to prevent a build up of pending
     * operations if the backend process cannot keep up. Clients need only
     * implement readValue() and writeValue() to perform the asynchronous
     * actions and use the callbacks provided to signal when operation is
     * complete. To trigger a refresh of the read value there is an onRefresh()
     * api to call. This should be called in the constructor as well to kick
     * start the state machine to read the initial value. This constructor needs
     * to be called from the derived classes constructor as well. For example,
     * gc.databind.AbstractAsyncBindValue.call(this);
     * 
     * @constructor
     * @extends gc.databind.AbstractLookupBindValue
     */
    gc.databind.AbstractAsyncBindValue = function(defaultType)
    {
        gc.databind.AbstractLookupBindValue.call(this, defaultType);

        this.setStale(true);
        this._state = IDLE;
        this._hasListeners = false;
    };

    gc.databind.AbstractAsyncBindValue.prototype = new gc.databind.AbstractLookupBindValue('string');

    gc.databind.AbstractAsyncBindValue.prototype.DEBUG_BINDING = undefined;

    gc.databind.AbstractAsyncBindValue.prototype._readable = true;
    gc.databind.AbstractAsyncBindValue.prototype._writable = true;
    gc.databind.AbstractAsyncBindValue.prototype._volatile = true;

    gc.databind.AbstractAsyncBindValue.prototype.addQualifier =
        function(qualifier)
        {
            // const = readable
            // readOnly = readable, volatile
            // writeOnly = writable
            // nonvolatile = readable, writable

            var wasVolatileBefore = this._volatile;

            if (qualifier === CONST || qualifier === READONLY)
            {
                this._writable = false;
            }

            if (qualifier === WRITEONLY)
            {
                this._readable = false;
            }

            if (qualifier === NONVOLATILE || qualifier === CONST || qualifier === WRITEONLY)
            {
                this._volatile = false;
            }

            // validate multiple qualifiers haven't created an invalid state
            if (!(this._readable || this._writable))
            {
                // can't read or write the target
                ti_logger.error(gc.databind.name, 'Invalid qualifier .$writeonly added to binding "' + this.getName() +
                    '" that already has an exisiting .$readonly or .$const qualifier.');
            }

            // kick start the read-once option
            if (wasVolatileBefore)
            {
                this.kickStartAReadOperation();
            }
        };

    /**
     * Abstract method to read the binding value asynchronously. The derived
     * class must implement this method and call the callback method with the
     * value as its first argument. This method will be called as a response to
     * the onRefresh() method being called as well as following a writeValue()
     * operation to read back the written value in case it is not the same. The
     * default implementation of this method does nothing.
     * 
     * @abstract
     * @protected
     * @param {gc.databind.AbstractAsyncBindValue~onReadValue} callback - to be
     *        called when the read operation has finished.
     */
    gc.databind.AbstractAsyncBindValue.prototype.readValue = function(callback)
    {
    };

    /**
     * Callback used by readValue.
     * 
     * @callback gc.databind.AbstractAsyncBindValue~onReadValue
     * @param {Object} newValue the bind value read asynchronously from
     *        somewhere.
     */

    /**
     * Abstract method to write the binding value asynchronously. The derived
     * class must implement this method and call the callback method when the
     * write operation has finished. This method will be called as a response to
     * the onValueChanged() or if another write operation has completed and
     * there is a delayed write operation pending. The default implementation of
     * this method does nothing.
     * 
     * @abstract
     * @protected
     * @param {gc.databind.AbstractAsyncBindValue~onWriteValue} callback - to be
     *        called when the write operation has finished.
     */
    gc.databind.AbstractAsyncBindValue.prototype.writeValue = function(callback)
    {
    };

    /**
     * Callback used by writeValue.
     * 
     * @callback gc.databind.AbstractAsyncBindValue~onWriteValue
     */

    var onDone = function(that, newValue)
    {
        if (that._state === DELAYED_WRITE)
        {
            that.changeState(WRITE);
            that.writeValue(function()
            {
                if (that._delayedProgress)
                {
                    that._delayedProgress.done();
                    that._delayedProgress = null;
                }
                onDone(that);
            });
        }
        else if (that._state === WRITE || that._state === DELAYED_READ || (that._state === READ && that.isConnected() === false))
        {
            if (that._readable)
            {
                // read back the value to see if the value we wrote stuck.
                that.changeState(READ);
                that.readValue(function(newValue)
                {
                    if (that._delayedProgress)
                    {
                        that._delayedProgress.done();
                        that._delayedProgress = null;
                    }
                    onDone(that, newValue);
                });
            }
            else
            {
                that.changeState(IDLE);
            }
        }
        else if (that._state === READ)
        {
            that.changeState(IDLE, newValue);
            that.updateValue(newValue);
            that.setStale(false);
        }
    };

    gc.databind.AbstractAsyncBindValue.prototype.changeState = function(newState, newValue)
    {
        this._state = newState;
        if (this.DEBUG_BINDING && this.getName().indexOf(this.DEBUG_BINDING) >= 0)
        {
            console.log(this.getName() + ' state = ' + this._state + ' value = ' + (newValue || this.fCachedValue));
        }
    };

    gc.databind.AbstractAsyncBindValue.prototype.onValueChanged = function(oldValue, newValue, progress)
    {
        var that = this;
        that.setStale(false); // ensure no longer stale if value set first
        // before reading from target.

        if (this._writable)
        {
            if (that._state === IDLE || that._state === ERROR_STATE)
            {
                that.changeState(WRITE);
                progress.wait();
                that.writeValue(function()
                {
                    progress.done();
                    onDone(that);
                });
            }
            else
            {
                that.changeState(DELAYED_WRITE);
                if (that._delayedProgress)
                {
                    that._delayedProgress.done();
                }
                progress.wait();
                that._delayedProgress = progress;
            }
        }
    };

    /**
     * Method meant to be an event handler for a refresh event. This method
     * kicks off a read operation if idle. If this object is busy with other
     * operations, then it is ignored because the refresh will happen as a
     * result of those operations. This method is designed to be used with
     * gc.databind.RefreshIntervalBindValue to provide a periodic polling event
     * to refresh the read value of this asynchronous binding. Simply attach
     * this object as a listener and onRefresh() will periodically be called.
     * 
     * @param {gc.databind.IProgressCounter} [progress] - a progress counter
     *        used to monitor asynchronous operations.
     */
    gc.databind.AbstractAsyncBindValue.prototype.onRefresh = function(progress)
    {
        var that = this;
        if (that._state === IDLE && that._hasListeners && that._volatile)
        {
            that.changeState(READ);
            progress = progress || nullProgressCounter;
            progress.wait();
            that.readValue(function(newValue)
            {
                onDone(that, newValue);
                progress.done();
            });
        }
    };

    gc.databind.AbstractAsyncBindValue.prototype.kickStartAReadOperation = function()
    {
        // kick start the read for nonvolatile readable bindings.
        if (this._state === IDLE && !this._volatile && this._readable)
        {
            var that = this;
            // we need to read this variable at least once in the beginning,
            // because it will
            // not be triggered by adding listeners or refresh timeouts.
            that.changeState(READ);
            that.readValue(function(newValue)
            {
                onDone(that, newValue);
            });
        }
    };

    gc.databind.AbstractAsyncBindValue.prototype.onDisconnected = function()
    {
        // clear any critical errors, which should restart the state machine
        this.reportCriticalError(null);
        this.kickStartAReadOperation();
    };

    gc.databind.AbstractAsyncBindValue.prototype.reportCriticalError = function(criticalError)
    {
        if (criticalError)
        {
            // prevent further target access until the critical error is
            // cleared.
            this._state = ERROR_STATE;
        }
        else if (this._state === ERROR_STATE && this._readable)
        {
            // critical error cleared, restart with the read cycle (discard any
            // user changes during the critical error).
            var that = this;
            that.changeState(READ);
            that.readValue(function(newValue)
            {
                onDone(that, newValue);
            });
        }
        this.setStatus(criticalError);
    };

    gc.databind.AbstractAsyncBindValue.prototype.isConnected = function()
    {
        return true;
    };

    gc.databind.AbstractAsyncBindValue.prototype.onFirstValueChangedListenerAdded = function()
    {
        if (!this._hasListeners)
        {
            this._hasListeners = true;
            if (this._state === IDLE)
            {
                this.onRefresh(); // kick start an update
            }
        }
    };
    
    gc.databind.AbstractAsyncBindValue.prototype.onFirstDataReceivedListenerAdded = 
        gc.databind.AbstractAsyncBindValue.prototype.onFirstValueChangedListenerAdded; 

    gc.databind.AbstractAsyncBindValue.prototype.onLastValueChangedListenerRemoved = function()
    {
        this._hasListeners = this.fEvents.hasAnyListeners('ValueChanged') || this.fEvents.hasAnyListeners('DataReceived');
    };

    gc.databind.AbstractAsyncBindValue.prototype.onLastDataReceivedListenerRemoved =  
        gc.databind.AbstractAsyncBindValue.prototype.onLastValueChangedListenerRemoved; 

    gc.databind.AbstractAsyncBindValue.prototype.isReadOnly = function()
    {
        return !this._writable;
    };
    
    gc.databind.AbstractAsyncBindValue.prototype.onIndexChanged = function() 
    {
        if (this._hasListeners && this._volatile)
        {
            if (this._state === READ)
            {
                this.changeState(DELAYED_READ);
            }
            else
            {
                this.onRefresh();
            }
        }
    };
    
    var applyQualifierHelper = function(bind) 
    {
        bind.addQualifier(this);
        return bind;
    };
    
    var qualifierList = [READONLY, WRITEONLY, NONVOLATILE, CONST];
    
    gc.databind.AbstractAsyncBindValue.addQualifiersToModel = function(model)
    {
        for(var i = qualifierList.length; i --> 0; )
        {
            model.addQualifier(qualifierList[i], applyQualifierHelper.bind(qualifierList[i]));
        }
    };
}());
