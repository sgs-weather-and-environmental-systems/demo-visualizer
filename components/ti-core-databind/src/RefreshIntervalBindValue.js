/*****************************************************************
 * Copyright (c) 2015 Texas Instruments and others
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

/**
 * Listener interface that provides the client with notification when 
 * its time to refresh something.    
 * 
 * @interface
 */ 
gc.databind.IRefreshListener = function()
{
};

/**
 * <p>This method is called when its time to refresh something</p>
 * 
 * @param {gc.databind.IProgressCounter} [progress] - interface for the client to indicate progress of
 * asynchronous operations so the client can determine when the refresh operation is fully completed.
 */
gc.databind.IRefreshListener.prototype.onRefresh = function(progress)
{
};

/** 
 * Class that implements IBindValue for a refresh interval value.  Clients can 
 * set the interval (in milliseconds) by calling setValue().  Also, clients can
 * register for onRefresh() listeners that will be called periodically based on
 * the current refresh interval.  This class is useful for providing the polling
 * events other bindings that need to poll to detect changes. 
 * 
 * @constructor
 * @extends gc.databind.VariableBindValue
 * @implements gc.databind.IValueBind
 */
gc.databind.RefreshIntervalBindValue = function(defaultValue) 
{
	var that = this;
	
	gc.databind.VariableBindValue.call(that, defaultValue || that.fCachedValue);

	that._hasListeners = false;
	
	this._updateListener = function() 
	{ 
		that.onRefresh();
	};
	
	this._resetTimer = function()
	{
		// only restart the timer if we have listeners and a timer is not pending.
		if (that._timer === undefined && that._hasListeners)
		{
		    var delay = that.getValue();
		    if (delay >= 0)
		    {
		        that._timer = setTimeout(that._updateListener, delay);
		    }
		}
	};
}; 

gc.databind.RefreshIntervalBindValue.prototype = new gc.databind.VariableBindValue(100);

gc.databind.RefreshIntervalBindValue.prototype.excludeFromStorageProviderData = true;

gc.databind.RefreshIntervalBindValue.prototype.onValueChanged = function()
{
	this.excludeFromStorageProviderData = undefined;
	this._resetTimer();  // kick start timer in case new value is not negative.
};

/**
 * Add a refresh listener for this bindable object.  Listeners will be notified 
 * periodically based on the refresh interval assigned. 
 *  
 * @param {gc.databind.IRefreshListener} listener - callback that will be notified when it time to refresh.  
 */
gc.databind.RefreshIntervalBindValue.prototype.addRefreshListener = function(listener)
{
	this.fEvents.addListener('Refresh', listener);
};

gc.databind.RefreshIntervalBindValue.prototype.onFirstRefreshListenerAdded = function()
{
	this._hasListeners = true;
	this._resetTimer();  // kick start the timer, if needed.
};

gc.databind.RefreshIntervalBindValue.prototype.onLastRefreshListenerRemoved = function()
{
	this._hasListeners = false;
};

gc.databind.RefreshIntervalBindValue.prototype.dispose = function()
{
	if (this._timer !== undefined)
	{
		clearTimeout(this._timer);
		this._timer = undefined;
	}
};

/**
 * Remove a refresh listener for this bindable object that was previously addded useing
 * addRefreshListener() api.   
 *  
 * @param {gc.databind.IRefreshListener} listener - callback to be removed.  
 */
gc.databind.RefreshIntervalBindValue.prototype.removeRefreshListener = function(listener)
{
	this.fEvents.removeListener('Refresh', listener);
};

gc.databind.RefreshIntervalBindValue.prototype.onRefresh = function()
{
	this._timer = undefined; // clear timer for next _resetTimer() call
	var progress = new gc.databind.ProgressCounter(this._resetTimer);
	this.fEvents.fireEvent('Refresh', progress);
	progress.done();
};