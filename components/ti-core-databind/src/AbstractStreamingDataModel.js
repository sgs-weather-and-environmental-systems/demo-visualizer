/*******************************************************************************
 * Copyright (c) 2015 Texas Instruments and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: Gingrich, Paul - Initial API and implementation
 ******************************************************************************/
var gc = gc || {};
gc.databind = gc.databind || {};

(function() // closure for private static methods and data.
{
    var StreamingDataBind = function(parent, fieldName)
    {
        gc.databind.VariableLookupBindValue.call(this);

        this.setStale(true);

        this.parentBind = parent;
        this.fieldName = fieldName;

        parent.addStreamingListener(this);
    };

    StreamingDataBind.prototype = new gc.databind.VariableLookupBindValue();

    StreamingDataBind.prototype.onDataReceived = function(newValue)
    {
        try
        {
            var value = newValue[this.fieldName];
            if (value !== undefined)
            {
                this.setData(value);
                this.setStale(false);
            }
        }
        catch (e)
        {
        }
    };

    StreamingDataBind.prototype.onValueChanged = function(oldValue, newValue, progress)
    {
        this.sendValue(newValue, progress);
    };

    StreamingDataBind.prototype.sendValue = function(value, progress)
    {
        var data = {};
        data[this.fieldName] = value;
        this.parentBind.sendValue(data, progress);
    };

    gc.databind.AbstractStreamingDataModel = function(name)
    {
        gc.databind.AbstractBindFactory.call(this, name);
    };

    gc.databind.AbstractStreamingDataModel.prototype = new gc.databind.AbstractBindFactory();

    gc.databind.AbstractStreamingDataModel.prototype.init = function()
    {
        gc.databind.AbstractBindFactory.prototype.init.call(this);

        this._streamingDataBind = new gc.databind.VariableLookupBindValue({});
        this._streamingDataBind.setIndex();
        var that = this;
        this._streamingDataBind.sendValue = function(value)
        {
            that.sendValue(value);
        };
    };

    gc.databind.AbstractStreamingDataModel.prototype.createNewBind = function(name)
    {
        if (name === '$rawData')
        {
            return this._streamingDataBind;
        }
        
        var pos = name.lastIndexOf('.');
        var parentBind;
        if (pos > 0)
        {
            parentBind = this.getBinding(name.substring(0, pos));
            name = name.substring(pos + 1);
        }
        else
        {
            parentBind = this._streamingDataBind;
        }
        return new StreamingDataBind(parentBind, name);
    };
    
    gc.databind.AbstractStreamingDataModel.prototype.encoder = function(nextValue)
    {
        this.sendPacket(nextValue);
    };
    gc.databind.AbstractStreamingDataModel.prototype.decoder = function(nextValue)
    {
        this._streamingDataBind.setData(nextValue);
        return true;
    };
    gc.databind.AbstractStreamingDataModel.prototype.receiveData = gc.databind.AbstractStreamingDataModel.prototype.decode;

    gc.databind.AbstractStreamingDataModel.prototype.createCodec = function(name) 
    {
        var result = new gc.databind.internal.PacketCodecFactory.create(name, this.encoder.bind(this), this.decoder.bind(this));
        if (!result)
        {
            console.error('Codec Regsitry: missing codec for data format: ' + name);
        }
        return result;
    };
    
}());
