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
gc.databind.internal = gc.databind.internal || {};

(function() 
{
    var test;
    
	var DSStub = function() 
	{
	};
	
	DSStub.prototype.expressions = 
	{ 
		data : {}, 
		evaluate : function(exp)
		{
			var pos = exp.indexOf('=');
			var value;
			
			if (pos > 0)
			{
				// assignment operation
				var lvalue = exp.substring(0, pos);
				value = exp.substring(pos+1);
				
				this.data[lvalue] = value;
			}
			else
			{
				value = this.data[exp];
			}
		
			return Q.Promise(function(resolve, reject) 
			{
				// set random delay between 1 and 10ms.
				setTimeout(function() 
				{ 
					resolve({ value : value, type : 'number', members : []}); 
				}, 0);
		
			});
		}
	};
	var ProgramModelTest = function()
	{
	};
	
	ProgramModelTest.prototype = new gc.databind.internal.AbstractUnitTestSuite("Program Model Tests");
	
	var dsStub = new DSStub();
	
	// fire target access ready with the stub for ds
	gc.target.access.fireReady(dsStub);
	
	var setValue = function(binding, newValue)
	{
		return function() 
		{
			return Q.Promise(function(resolve, reject) 
			{
			    test.start("set value of " + binding.getName() + " to " + newValue);
				
				var progress = new gc.databind.ProgressCounter(function() 
				{
					// finished operation
					test.assertEquals(dsStub.expressions.data[binding.getName()], newValue); 
					resolve();
				});
				binding.setValue(newValue, progress);
				progress.done();
			});
		};
	};
	
	var changeValue = function(binding, newValue, init)
	{
		return function() 
		{
			return Q.Promise(function(resolve, reject) 
			{
			    test.start("change value of " + binding.getName() + " to " + newValue);
				
				var changedListener = 
				{
					onValueChanged : function() 
					{
						test.assertEquals(binding.getValue(), newValue);
						binding.removeChangedListener(changedListener);
						resolve();
					}
				};
				
				binding.addChangedListener(changedListener);
				setTimeout(function() 
				{
					dsStub.expressions.data[binding.getName()] = newValue;
				}, 0);
			});
		};
	};
	
	var verifyChangeNotification = function(binding, expectedValue)
	{
		return function() 
		{
			return Q.Promise(function(resolve, reject) 
			{
			    test.start("change notification for " + binding.getName());
				
				var changedListener = 
				{
					onValueChanged : function() 
					{
						test.assertEquals(binding.getValue(), expectedValue);
						binding.removeChangedListener(changedListener);
						resolve();
					}
				};
				binding.addChangedListener(changedListener);
			});
		};
	};
	
	ProgramModelTest.prototype.run = function()
	{
	    test = this;
	    
		var promise = Q();

		// set refreshRate
		var bindings = gc.databind.registry;
		
		bindings.defaultModel('pm');
		
		var refreshBind = bindings.getBinding('pm.$refresh_interval');
		refreshBind.setValue(500);
		
		test.assertEquals(refreshBind.getValue(), 500);
		
		// get binding - ensure it is stale until value is set.
		var X = 'x';
		dsStub.expressions.data[X] = '56';
		var bind = bindings.getBinding(X);
		test.assertTrue(bind.isStale());
		
		return Q().then(verifyChangeNotification(bind, '56'))
		    .then(setValue(bind, 'testing'))
		    .then(changeValue(bind, 'ok'));
	};
	
	gc.databind.internal.TestSuites.add(new ProgramModelTest());
	
}());