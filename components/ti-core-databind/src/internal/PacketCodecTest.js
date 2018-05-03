/*****************************************************************
 * Copyright (c) 2013-2014 Texas Instruments and others
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *  Paul Gingrich, Dobrin Alexiev - Initial API and implementation
 *****************************************************************/
var gc = gc || {};
gc.databind = gc.databind || {};
gc.databind.internal = gc.databind.internal || {};

(function() 
{
    var test;
    var sinkData = [];
    for(var i = 256; i-- > 0; )
    {
        sinkData.push(i);
    }
    
	var sinkDecoder = function(decodedResult)
    {
        if (decodedResult instanceof window.ArrayBuffer)
        {
            decodedResult = new window.Uint8Array(decodedResult);
        }
        test.assertArrayEquals(sinkData, decodedResult);
        return true;
    };
    
    var encodedResult;
    var sinkEncoder = function(dataToSend)
    {
        encodedResult = dataToSend;
    };
    
    var splitterCodec = function()
    {
    };
    
    splitterCodec.prototype = new gc.databind.IPacketCodec();
    
    splitterCodec.prototype.encode = function(target, value)
    {
        return target(value);
    };
    
    splitterCodec.prototype.decode = function(target, rawdata)
    {
        var message = typeof rawdata === 'string' ? rawdata : String.fromCharCode.apply(null, rawdata);

        target(message.substring(0, 1));
        target(message.substring(1, 100));
        target(message.substring(100, message.length - 1));
        return target(message.substring(message.length-1));
    };
    
    gc.databind.registerCustomCodec("SP", splitterCodec);
    
    var evaluate = function(codecName)
    {
        test.start(codecName);
        var codec = new gc.databind.internal.PacketCodecFactory.create(codecName, sinkEncoder, sinkDecoder);
        
        try
        {
            codec.encoder(sinkData);
            var results = encodedResult;
            if (typeof results === 'string') 
            {
                var newResults = [];
                for(var i = 0; i < results.length; i++)
                {
                    var data = results.charCodeAt(i);
                    newResults.push(data);
                }
                results = newResults;
            }
            test.assertTrue(codec.decoder(results));
        }
        catch(e)
        {
            test.fail(e.toString());
        }
    };
    
    var PacketCodecTest = function()
    {
    }; 
    
    PacketCodecTest.prototype = new gc.databind.internal.AbstractUnitTestSuite("Packet Codec Tests");
    
    PacketCodecTest.prototype.run = function() 
    {
        test = this;
        
        evaluate('base64');
        evaluate('base64+CR');
        
        evaluate('raw');
        
        sinkData = { data: sinkData };
        
        evaluate('JSon');
        evaluate('json+cr');
        evaluate('json+cr+sp');
    };

    gc.databind.internal.TestSuites.add(new PacketCodecTest());
    
}());