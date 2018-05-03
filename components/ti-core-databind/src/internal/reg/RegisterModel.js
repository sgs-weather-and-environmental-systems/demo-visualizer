/*****************************************************************
 * Copyright (c) 2017 Texas Instruments and others
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *  Paul Gingrichv - Initial API and implementation
 *****************************************************************/
var gc = gc || {};
gc.databind = gc.databind || {};
gc.databind.internal = gc.databind.internal || {};
gc.databind.internal.reg = gc.databind.internal.reg || {};

(function() // closure for private static methods and data.
{
	var REGISTER_MODEL = "reg";
	
	gc.databind.internal.reg.RegisterModel = function(codec, name) 
	{
        gc.databind.AbstractBindFactory.call(this, name);
        
        this.init();

	    this._codec = codec;
        this._symbols = {};
        this._calculatedBindings = {};
	};
	
	gc.databind.internal.reg.RegisterModel.prototype = new gc.databind.AbstractPollingDataModel(REGISTER_MODEL);
	
	gc.databind.internal.reg.RegisterModel.prototype.createNewBind = function(uri)
	{
	    try 
	    {
            // support for .# for bits within fields or registers 
            var pos = uri.lastIndexOf('.');
            if (pos > 0)
            {
                var bitNumber = uri.substring(pos+1);
                if (!isNaN(bitNumber))
                {
                    var parentBind = this.getBinding(uri.substring(0, pos));
                    if (parentBind)
                    {
                        // TODO: test that error messages in parent bind are propagated through the field bind
                        return new gc.databind.internal.reg.FieldBind("", parentBind, undefined, +bitNumber);
                    }
                }
            }
            
            var symbolData = this._symbols[uri];
            if (symbolData)
            {
                if (symbolData.fullyQualifiedName !== REGISTER_MODEL + '.' + uri)
                {
                    // make sure all aliases share the same fully qualified name binding.
                    return gc.databind.registry.getBinding(symbolData.fullyQualifiedName);
                }
                
                if (symbolData.parentRegister)
                {
                    // support for fields within registers
                    var registerBind = gc.databind.registry.getBinding(symbolData.parentRegister.fullyQualifiedName);
                    
                    return new gc.databind.internal.reg.FieldBind(symbolData.id || symbolData.name, registerBind, symbolData.type, 
                        gc.utils.string2value(symbolData.start), gc.utils.string2value(symbolData.stop));
                }
                
                var result = new gc.databind.internal.reg.RegisterBind(uri, this, this._modelBindings.$refresh_interval, gc.utils.string2value(symbolData['default']));
                
                // support for qualifiers in register symbol data
                if (symbolData.type === 'R')
                {
                    result.addQualifier('readonly');
                }
                else if (symbolData.type === 'W')
                {
                    result.addQualifier('writeonly');
                }
                else if (symbolData.type === "const" || symbolData.type === "nonvolatile")
                {
                    result.addQualifier(symbolData.type);
                }
                return result;
                }
                else if (this._calculatedBindings.hasOwnProperty(uri))
                {
                    var defaultModel = gc.databind.registry.defaultModel();
                    gc.databind.registry.defaultModel(REGISTER_MODEL);
                    var bindResult = gc.databind.registry.getBinding(this._calculatedBindings[uri]);
                    gc.databind.registry.defaultModel(defaultModel);
                    return bindResult;
                }
                else
                {
                    // symbolic information is not available 
                var message;
                var segment = uri.split('.');
                if (segment.length > 2)
                {
                    message = 'Binding "' + uri + '" is not recognized.  Expecting to see <register name>.<bit field name>';
                }
                else if (!this._symbols[segment[0]])
                {
                    message = 'Register "' + segment[0] + '" is not recognized.  Please check the spelling.'; 
                }
                else 
                {
                    message = 'Bit field "' + segment[1] + '" is not recognized for register "' + segment[0] + '"';
                }
                throw message;
            }
	    }
        catch(errorMessage)
		{
            var errorBind = new gc.databind.VariableBindValue(undefined, true);
            errorBind.setStatus(gc.databind.AbstractStatus.createErrorStatus(errorMessage));
            return errorBind;
		}
	};
	
    gc.databind.internal.reg.RegisterModel.prototype.connect = function(dataValidationCallback)
    {
        this.callbackForDataValidation = dataValidationCallback;
        this.setConnectedState(true);
    };
    
    gc.databind.internal.reg.RegisterModel.prototype.disconnect = function()
    {
        this.callbackForDataValidation = undefined;
        this.setConnectedState(false);
    };

    
    gc.databind.internal.reg.RegisterModel.prototype.addSymbol = function(symbolName, symbolData)
    {
        /* truth table
         *                       new entry
         * existing entry | Register |  Field   |  
         * ===============+=====================+
         *      undefined | replace  | replace  |
         *           null | replace  |   skip   |
         *       Register | replace  |   skip   |
         *          Field | replace  | set null |
         */
        symbolName = symbolName.split(' ').join('_');  // convert spaces to underscores
        var symbolEntry = this._symbols[symbolName];
        if (symbolEntry === undefined || !symbolData.parentRegister)
        {
            this._symbols[symbolName] = symbolData;  // replace
        }
        else if (symbolEntry && symbolEntry.parentRegister)
        {
            this._symbols[symbolName] = null; // remove duplicates from the symbol table, unless field is trying to override a register.
        }
        return symbolName;
    };
    
    gc.databind.internal.reg.RegisterModel.prototype.addSymbols = function(registerData)
    {
        var devices = registerData.devices || [];
        for(var n = devices.length; n-- > 0; )
        {
            var device = devices[n];
            if (device.address) 
            {
                device.address = gc.utils.string2value(device.address);
            }

            var commInterface = device['interface'];
            if (!commInterface)
            {
                throw 'register-defs .json file is missing an interface field for device "' + device.name + '".';
            }
            if (!registerData[commInterface])
            {
                throw 'register-defs .json file is missing an entry for interface "' + commInterface + '".';
            }
            var groups = (device.data && device.data.regblocks) || [];
            for(var i = groups.length; i-- > 0; )
            {
                var symbolName;
                var group = groups[i];
                group.parentDevice = device;
                var regs = group.registers || [];
                for(var j = regs.length; j-- > 0; )
                {
                    var reg = regs[j];
                    reg.parentGroup = group;
                    reg.nBytes = Math.ceil(reg.size/8);
                    reg.addr = gc.utils.string2value(reg.addr);
                    var fields = reg.fields || [];
                    for(var k = fields.length; k-- > 0; )
                    {
                        var field = fields[k];
                        field.parentRegister = reg;
                        symbolName = field.id || field.name;
                        this.addSymbol(symbolName, field);
                        symbolName = (reg.id || reg.name) + '.' + symbolName;
                        field.fullyQualifiedName = REGISTER_MODEL + '.' + this.addSymbol(symbolName, field);
                    }
                    symbolName = reg.id || reg.name;
                    reg.fullyQualifiedName = REGISTER_MODEL + '.' + this.addSymbol(symbolName, reg);
                }
            }
            
            var bindings = device["calculated bindings"];
            if (bindings)
            {
                // copy bindings into calculated bindings
                for(var bindName in bindings)
                {
                    if (bindings.hasOwnProperty(bindName))
                    {
                        this._calculatedBindings[bindName] = bindings[bindName];
                    }
                }
            }
        }
    };
    
    gc.databind.internal.reg.RegisterModel.prototype.getSymbolSuggestions = function(prefix)
    {
        prefix = prefix || "";
        var result = [];
        for(var symbolName in this._symbols)
        {
            if (this._symbols.hasOwnProperty(symbolName) && symbolName.indexOf(prefix) === 0)
            {
                result.push(symbolName);    
            }
        }
        return result;
    };
    
    gc.databind.internal.reg.RegisterModel.prototype.readValue = function(uri)
    {
        return this._codec.readValue(this._symbols[uri]);
    };
    
    gc.databind.internal.reg.RegisterModel.prototype.writeValue = function(uri, value)
    {
        return this._codec.writeValue(this._symbols[uri], value);
    };
    
}());






