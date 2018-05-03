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

(function()
{
    var errorReportCallback = function() {};
    
    var AbstractUnitTestSuite = function(name) 
    {
        this.testCount = 0;
        this.testExpression = null;
        this.errorCount = 0;
        
        this.testSuiteName = name;
        
        this.summary = "Pending ...";
    };
    
    AbstractUnitTestSuite.prototype.log = function(message)
    {
        this.summary = message;
        console.log(this.testSuiteName + ': ' + message);
    };
    
    AbstractUnitTestSuite.prototype.error = function(message)
    {
        this.summary= message;
        console.error(this.testSuiteName + ': ' + message);
    };
    
    AbstractUnitTestSuite.prototype.fail = function(message)
    {
        if (this.canIncrementErrorCount)
        {
            this.errorCount++;
            this.canIncrementErrorCount = false;  // only increment error once for each test, even though they may fail multiple times in on test.
        }
        message = this.testSuiteName + ': ' + 'Failed test ' + this.testCount + ' "' + this.testExpression + '" : ' + message;
        errorReportCallback(message);
        
        console.log(message);
    };

    AbstractUnitTestSuite.prototype.assertNull = function(value)
    {
        if (value !== null && value !== undefined)
        {
            this.fail("non null value found.  Expected it to be null");
        }
    };

    AbstractUnitTestSuite.prototype.assertNotNull = function(value)
    {
        if (value === null || value === undefined)
        {
            this.fail("null value found.  Expected it to be not null");
        }
    };

    AbstractUnitTestSuite.prototype.assertTrue = function(value)
    {
        if (value !== true)
        {
            this.fail("assertion failed. Expected true result but it was false instead.");
        }
    };

    AbstractUnitTestSuite.prototype.assertEquals = function(expected, actual)
    {
        if (actual != expected)
        {
            if (!isNaN(actual) || !isNaN(expected))
            {
                this.fail("got '" + actual +"' but was expecting '" + expected +"'");
            }
        }
    };

    AbstractUnitTestSuite.prototype.assertArrayEquals = function(expected, actual)
    {
        var actualLen = actual.length;
        var expectedLen = expected.length;

        if (actualLen != expectedLen)
        {
            this.fail("expected array with " + expectedLen + " elements, but got " + actualLen + " instead.");
        }

        for (var i = 0; i < actualLen; i++)
        {
            this.assertEquals(actual[i], expected[i]);
        }
    };
    
    var onFailure = function(e)
    {
        try
        {
            this.error('Aborted after ' + this.testCount + ' test cases due to uncaught exception.');
            this.fail(e);
        }
        catch(err)
        {
            // make sure onFailure returns something so the exception is consumed by the promises and doesnt trickle out.
        }
    };
    
    var onSuccess = function()
    {
        console.timeEnd(this.testSuiteName);
        
        if (this.errorCount === 0)
        {
            this.log('Passed all  ' + this.testCount + " test cases.");
        }
        else
        {
            this.error('Failed ' + this.errorCount + " out of " + this.testCount + ' test cases.');
        }
        return true;
    };

    var runTestSuite = function()
    {
        this.log(' starting ...');
        console.time(this.testSuiteName);
        
        return this.run(); 
    };
    
    AbstractUnitTestSuite.prototype.run = function()
    {
        throw "Missing run() method for " + this.testSuiteName;
    };
    
    AbstractUnitTestSuite.prototype.start = function(expression)
    {
        this.testCount++;
        this.testExpression = expression;
        this.canIncrementErrorCount = true;  
    };
    
    gc.databind.internal.AbstractUnitTestSuite = AbstractUnitTestSuite;

    var testSuiteList = [];
    
    gc.databind.internal.TestSuites = 
    {
        add: function(testSuite)
        {
            testSuiteList.push(testSuite);
        },
    
        runAll: function(callback)
        {
            errorReportCallback = callback || errorReportCallback;
            var result = Q();
            for(var i = 0; i < testSuiteList.length; i++ )
            {
                var testSuite = testSuiteList[i];
                result = result.then(runTestSuite.bind(testSuite)).then(onSuccess.bind(testSuite), onFailure.bind(testSuite));
            }
            return result.then(this.getTestResults);
        },
        
        getTestResults: function()
        {
            var results = [];
            var rowItems = [];
            for(var i = 0; i < testSuiteList.length; i++ )
            {
                var testSuite = testSuiteList[i];
                
                results.push(testSuite.testSuiteName + ',' + testSuite.summary);
            }
            return results.join(';');
        }
    };
}());
