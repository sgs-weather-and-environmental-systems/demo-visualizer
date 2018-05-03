/*****************************************************************
 * Copyright (c) 2017 Texas Instruments and others
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *  Paul Gingrich - Initial API and implementation
 *****************************************************************/
var gc = gc || {};
gc.databind = gc.databind || {};
gc.databind.internal = gc.databind.internal || {};
gc.databind.internal.reg = gc.databind.internal.reg || {};

(function() 
{
    gc.databind.internal.reg.RegisterBind = function(uri, model, refreshIntervalProvider, defaultValue) 
    {
        gc.databind.AbstractAsyncBindValue.call(this, 'number');
        
        var that = this;
        
        that.uri = uri;
        that.parentModel = model;
        
        that._onFailure = function(errMsg)
        {
            if (that.parentModel.isConnected())
            {
                that.reportErrorStatus(errMsg);
            }
            var callback = that._callback;
            that._callback = undefined;
            callback(that.fCachedValue);  // don't record a new value, keep the same value as before. 
        };
        
        that._onSuccess = function(result)
        {
            // clear errors on succesfull read
            that.reportCriticalError(null);
            
            return result;
        };
        
        // add refresh listener and create dispose() method to remove listener when done.
        refreshIntervalProvider.addRefreshListener(that);
        that.dispose = function()
        {
            refreshIntervalProvider.removeRefreshListener(that);
        };
        
        if (defaultValue !== undefined)
        {
            this.fCachedValue = defaultValue;
        }
    }; 
    
    gc.databind.internal.reg.RegisterBind.prototype = new gc.databind.AbstractAsyncBindValue('number');

    gc.databind.internal.reg.RegisterBind.prototype.writeValue = function(callback)
    {
        this._callback = callback;
        this.parentModel.writeValue(this.uri, this.fCachedValue).then(callback).fail(this._onFailure);
    };
    
    gc.databind.internal.reg.RegisterBind.prototype.readValue = function(callback)
    {
        this._callback = callback;
        this.parentModel.readValue(this.uri).then(this._onSuccess).then(callback).fail(this._onFailure); 
    };
    
    gc.databind.internal.reg.RegisterBind.prototype.reportErrorStatus = function(errorMessage)
    {
        var status = null;
        if (errorMessage && errorMessage.length > 0)
        {
            status = gc.databind.AbstractStatus.createErrorStatus(errorMessage, 'target');
        }
        this.reportCriticalError(status);
    };
    
    var typeParser = /\s*(unsigned\s|signed\s)?\s*(int|q(\d+))\s*/i;
    
    var onChangedListener = function()
    {
        var value = (this.parentBind.getValue() & this._mask) >>> this._shift;
        
        if (this._maxValue && (value >= this._maxValue))
        {
            // convert to signed
            value = value - (this._maxValue << 1);
        }
        if (this._q && !isNaN(value))
        {
            value = value / (Math.pow(2, this._q));
        }
        
        this.updateValue(value); 
    };
    
    gc.databind.internal.reg.FieldBind = function(name, registerBind, type, startBit, stopBit) 
    {
        gc.databind.AbstractBindValue.call(this, 'number');

        this.parentBind = registerBind;
        
        var parentChangedListener = new gc.databind.IChangedListener();
        parentChangedListener.onValueChanged = onChangedListener.bind(this);
        registerBind.addChangedListener(parentChangedListener);
        
        this.dispose = function()
        {
            registerBind.removeChangedListener(parentChangedListener);
        };
        
        startBit = startBit || 0;
        stopBit = stopBit || startBit;
        var bitWidth = stopBit - startBit + 1;
        this._mask = (1 << (startBit + bitWidth)) - (1 << startBit);
        this._shift = startBit; 
        
        if (type)
        {
            var match = typeParser.exec(type);
            if (match && match.index === 0)
            {
                var isUnsigned = match[1] && match[1].toLowerCase() === 'unsigned'; 
                if (!isUnsigned)
                {
                    this._maxValue = 1 << (bitWidth - 1);
                }
                var q = match[3] && +match[3];
                if (!q || isNaN(q) || q < 0)
                {
                    throw "invalide type declaration for field: " + name;
                }
                else if (q > 0)
                {
                    this._q = q;
                }
            }
            else
            {
                throw "invalide type declaration for field: " + name;
            }
        }

        // initialize value based on default register value.
        parentChangedListener.onValueChanged();
    };
    
    gc.databind.internal.reg.FieldBind.prototype = new gc.databind.AbstractBindValue('number');

    gc.databind.internal.reg.FieldBind.prototype.onValueChanged = function(oldValue, newValue, progress)
    {
        newValue = +newValue;
        if (this._q && !isNaN(newValue))
        {
            newValue = Math.round(newValue * Math.pow(2, this._q));
        }
        
        newValue = (newValue << this._shift) & this._mask;
        oldValue = this.parentBind.getValue() & ~this._mask;
        this.parentBind.setValue(newValue | oldValue); 
    };
    
    gc.databind.internal.reg.FieldBind.prototype.onFirstDataReceivedListenerAdded = function() 
    {
        this.parentBind.addStreamingListener(this);
    };

    /**
     * Method called when the last streaming listener is removed from the list.
     * Derived classes can override this method to be notified for this event.
     */
    gc.databind.internal.reg.FieldBind.prototype.onLastDataReceivedListenerRemoved = function()
    {
        this.parentBind.removeStreamingListener(this);
    };
    
    gc.databind.internal.reg.FieldBind.prototype.onDataReceived = function()
    {
        this.notifyDataReceivedListeners(this.fCachedValue);
    };
    
}());


