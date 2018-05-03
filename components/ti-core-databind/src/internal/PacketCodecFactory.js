/*****************************************************************
 * Copyright (c) 2016-17 Texas Instruments and others
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

(function() 
{
    var codecAliases = {};
    var codecRegistry = {};
    var nullFunction = function() {};

    gc.databind.internal.PacketCodecFactory = 
    {
        create: function(codecName, encoder, decoder)
        {
            codecName = codecAliases[codecName] || codecName;
            var codecs = codecName.toLowerCase().split('+');
            encoder = encoder || nullFunction;
            decoder = decoder || nullFunction;
            
            for(var i = codecs.length; i-- > 0; )
            {
                var codec = codecs[i];
                codec = codecRegistry[codec.toLowerCase()];
                codec = codec && new codec();
                if (codec)
                {
                    encoder = codec.encode.bind(codec, encoder);
                }
                codecs[i] = codec;
            }
            for(i = 0; i < codecs.length; i++ )
            {
                if (codecs[i])
                {
                    decoder = codecs[i].decode.bind(codecs[i], decoder);
                }
            }
            var result = codecs[0];
            result.encoder = encoder;
            result.decoder = decoder;
            return result;
        }
    };
    
    gc.databind.registerCustomCodec = function(name, constructor, baseCodecs)
    {
        name = name.toLowerCase();
        codecRegistry[name] = constructor;
        if (baseCodecs)
        {
            codecAliases[name] = name + '+' + baseCodecs;
        }
    };
}());

