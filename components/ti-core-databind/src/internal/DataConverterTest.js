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
	var DataConverterTest = function()
	{
		
	}; 
	
	DataConverterTest.prototype = new gc.databind.internal.AbstractUnitTestSuite("Data Converter Tests");
	
	var converter = gc.databind.DataConverter;
	var test;
	
	var evaluate = function(result, source, destinationType, param)
	{
	    test.start(source.toString() + ' --> ' + destinationType);
		
		try
		{
			var convertedResult = converter.convert(source, typeof source, destinationType, param);
			test.assertEquals(result, convertedResult);
		}
		catch(e)
		{
			test.assertEquals(result, e.toString());
		}
	};
	
    DataConverterTest.prototype.run = function()
	{
        test = this;
        
		// numeric conversion
		var A = 13;
		var B = 263;
		var C = 19;
		var D = -2343;
		var X = 11883.54834;
		var Y = -1893.94943;
		var BOOL = true;
		var S = "test with a space";
		var hex = "0xbabe";
		
		// Number conversions
		evaluate(Number(A), A, "number");
		evaluate(Number(B), B, "number");
		evaluate(Number(C), C, "number");
		evaluate(Number(D), D, "number");
		evaluate(Number(X), X, "number");
		evaluate(Number(Y), Y, "number");
        evaluate(Number(BOOL), BOOL, "number");
        evaluate(Number(S), S, "number");
        evaluate(Number(hex), hex, "number");

		// String conversions
		evaluate(String(A), A, "string");
		evaluate(String(B), B, "string");
		evaluate(String(C), C, "string");
		evaluate(String(D), D, "string");
		evaluate(String(X), X, "string");
		evaluate(String(Y), Y, "string");
		evaluate(String(BOOL), BOOL, "string");
        evaluate(String(S), S, "string");
        evaluate(String(hex), hex, "string");
		
        // Boolean conversions
        evaluate(Boolean(A), A, "boolean");
        evaluate(Boolean(B), B, "boolean");
        evaluate(Boolean(C), C, "boolean");
        evaluate(Boolean(D), D, "boolean");
        evaluate(Boolean(X), X, "boolean");
        evaluate(Boolean(Y), Y, "boolean");
        evaluate(Boolean(BOOL), BOOL, "boolean");
        evaluate(false, S, "boolean");
        evaluate(true, hex, "boolean");
        evaluate(false, 0, "boolean");
        evaluate(true, 1, "boolean");
        evaluate(false, '0x0', "boolean");
        evaluate(true, '0x1', "boolean");
        
        // Hex conversions
        evaluate('0xD', A, "hex");
        evaluate('0x0107', B, "hex", 4);
        evaluate('0x13', C, "hex");
        evaluate('0xFFFFF6D9', D, "hex");
        evaluate('0xFFFFFF', -1, "hex", 6);
        evaluate('0x1', BOOL, "hex");
        evaluate('0xNaN', S, "hex");
        evaluate('0xBABE', hex, "hex");
        
        // Binary conversions
        evaluate('01101', A, "binary", 5);
        evaluate('00000111', B, "binary", 8);
        evaluate('10011', C, "binary");
        evaluate('11111111111111111111011011011001', D, "binary");
        evaluate('1111111111111111', -1, "binary", 16);
        evaluate('1', BOOL, "binary");
        evaluate('NaN', S, "binary");
        evaluate('1011101010111110', hex, "binary");
        
        // Decimal conversions
        evaluate('13.00000', A, "dec", 5);
        evaluate('263.00000000', B, "dec", 8);
        evaluate('19', C, "dec");
        evaluate('-2343', D, "dec");
        evaluate('11883.55', X, "dec", 2);
        evaluate('-1893.949430', Y, "dec", 6);
        evaluate('1', BOOL, "dec");
        evaluate('NaN', S, "dec");
        evaluate((+hex).toFixed(0), hex, "dec", 0);
        
        // Exponential conversions
        evaluate(A.toExponential(5), A, "exp", 5);
        evaluate(B.toExponential(8), B, "exp", 8);
        evaluate(C.toExponential(), C, "exp");
        evaluate(D.toExponential(), D, "exp");
        evaluate(X.toExponential(2), X, "exp", 2);
        evaluate(Y.toExponential(6), Y, "exp", 6);
        evaluate((+BOOL).toExponential(), BOOL, "exp");
        evaluate('NaN', S, "exp");
        evaluate((+hex).toExponential(0), hex, "exp", 0);
	};
	
	gc.databind.internal.TestSuites.add(new DataConverterTest());
	
}());