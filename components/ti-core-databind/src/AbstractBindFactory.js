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

(function() 
{
    var StorageProvider = function(modelBindings) 
    {
        this._bindings = modelBindings;
    };
    
    StorageProvider.prototype.readData = function()
    {
        var data = {};
        for(var bindName in this._bindings)
        {
            if (this._bindings.hasOwnProperty(bindName))
            {
                var bind = this._bindings[bindName];
                if (!bind.isReadOnly() && bind.excludeFromStorageProviderData === undefined)
                {
                    data[bindName] = this._bindings[bindName].getValue();
                }
            }
        }
        return data;
    };
    
    StorageProvider.prototype.writeData = function(data)
    {
        for(var bindName in data)
        {
            if (data.hasOwnProperty(bindName))
            {
                var bind = this._bindings[bindName];
                if (bind)
                {
                    bind.setValue(data[bindName]);
                }
            }
        }
    };
    
    var TARGET_CONNECTED_BINDNAME = '$target_connected';
    
	/**
	 * Abstract class that provides default implementation of IBindFactory.  This class
	 * implements the getName() method for IBindFactory.
	 *
	 * @constructor
	 * @implements gc.databind.IBindFactory
	 * @param {string} name - uniquely identifiable name for this bind factory.
    */
	gc.databind.AbstractBindFactory = function(name) 
	{
        if ( name !== undefined )
        {
            this._id = name;
        }
	};
	
	gc.databind.AbstractBindFactory.prototype = new gc.databind.IBindFactory();

    /**
     * Method to initialize internal private data structures, and create the $target_connected binding.  
     * This method must be called once from the concrete class instance's constructor.  
     *
     */
    gc.databind.AbstractBindFactory.prototype.init = function()
    {
        this._modelBindings = {};
        this._modelBindings[TARGET_CONNECTED_BINDNAME] = new gc.databind.VariableBindValue(false, true);
        this._modelQualifiers = new gc.databind.internal.QualifierFactoryMap();
        
        var modelBindings = this._modelBindings;

        gc.File = gc.File || {};
        gc.File.ready = gc.File.ready || Q.Promise(function(resolve) { gc.File.fireReady = resolve; });
        gc.File.ready.then(function() 
        {
            // register data provider to load and store data from the factory provided when called upon.
            gc.File.addDataProvider(name, new StorageProvider(modelBindings));
        });
    };
    
	/** @inheritdoc IBindFactory#getName */
	gc.databind.AbstractBindFactory.prototype.getName = function()
	{
		return this._id;
	};
	
	/**
	 * Helper method for finding and or creating bindings on this model.  This method simply wraps a call
	 * to gc.databind.registry.getBinding() by prepending the model name to the binding name. 
	 * For example, getBinding('volume') on model 'audio' would
	 * turn into a call to gc.databind.registry.getBinding('audio.volume');    
	 * 
	 * @param {String} name - uniquely identifying the bindable object within the model.  
	 * @return {gc.databind.IBind} - the existing or newly created bindable object, or null if this name is not supported.
	 */
	gc.databind.AbstractBindFactory.prototype.getBinding = function(name)
	{
        // ensure aliased bindings like "uart.temp" and "target_dev.temp" return the same instance of the model's binding.
        // We do this by storing model bindings in the model factory so we can lookup aliased bindings.
        var bind = this._modelBindings[name];
        if (!bind)
        {
            bind = this.createNewBind(name);
            this._modelBindings[name] = bind;
        }
		return bind;
	};
	
	gc.databind.AbstractBindFactory.prototype.parseModelBinding = function(name)
	{
	    return this._modelQualifiers.parseQualifiers(name, this.getBinding, this);
	};
	
    gc.databind.AbstractBindFactory.prototype.getAllBindings = function()
    {
        return this._modelBindings;
    };
    
    gc.databind.AbstractBindFactory.prototype.setConnectedState = function(newState)
    {
        this._modeBindings[TARGET_CONNECTED_BINDNAME].updateValue(newState);
    };
    
    gc.databind.AbstractBindFactory.prototype.isConnected = function()
    {
        return this._modeBindings[TARGET_CONNECTED_BINDNAME].getValue();
    };
    
    gc.databind.AbstractBindFactory.prototype.addQualifier = function(name, factory)
    {
        this._modelQualifiers.add(name, factory);
    };
}());
