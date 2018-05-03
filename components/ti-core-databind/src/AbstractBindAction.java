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
var gc = gc | {};
gc.databind = gc.databind || {};

/** 
 * Abstract class that implements IBindAction interface. Clients can derive this class to  
 * implement action bind objects. Derived classes need to implement the run() method.
 * 
 * @constructor
 * @implements gc.databind.IBindAction
 * @extends gc.databind.AbstractBindValue
 * @param model - the model that creates this object. 
 * @param initialValue - specifies if the action is initially available or not.
 */
gc.databind.AbstractBindAction = function(initialValue)
{
	gc.databind.AbstractBindValue.call(this);

	if (initialValue !== undefined)
	{
		this.fCachedValue = initialValue;
	}
}

gc.databind.AbstractBindAction.prototype = new gc.databind.AbstractBindValue(undefined, true, "boolean");

/**
 * Tries to retrieve a parameter with the name 'name' and type 'expectedType' from the
 * JSON object 'params'. If such parameter is not found, checks if a value bind with that 
 * parameter name exists. 
 *  
 * @
 * @param {Object} params - the object containing all parameters as members. 
 * @param {string} name - the name of the expected parameter.
 * @param {string} expectedType - the type of the expected parameter.
 * @param retStatus - if this parameter is not null, when the method returns 
 * 					  it will contain the encountered error in its zero indexed element. 
 * 
 * @return the value of the parameter. 
 */
@SuppressWarnings("unchecked")
protected<T> T getParameter(Object params, String name, Class<?> expectedType, IStatus[] retStatus) {

	// check if it is in the parameters list. 
	if((params instanceof Map)) {
		Map<?,?> map = (Map<?,?>)params;
		if( map.containsKey(name)) {
			Object obj = map.get(name);
			return (T)castParamOrBind( obj, retStatus, expectedType, "Parameter "+name);  
		}
	}

	// now use the binding value.
	String paramURI = getBindForParameter(name);
	IBind bind = getModel().getBackplane().getBinding(paramURI);
	if( bind == null) {
		fillStatus( retStatus, "Bind "+ paramURI + " does not exists");
		return null;
	}
	if(!( bind instanceof IBindValue)) {
		fillStatus( retStatus, "Bind "+ paramURI + " is not IBindValue.");
		return null;
	}
	IBindValue bindValue = (IBindValue)bind;
	Object obj = bindValue.getValue();
	return (T)castParamOrBind( obj, retStatus, expectedType, "Bind "+paramURI);  
}

/** 
 * This method checks if an object is of the specified type.
 *  
 * @param obj - the object to be tested for the specified type.
 * @param retStatus - the error status in case of error.
 * @param expectedType - the expected type.
 * @param prefixMessage - additional message that will be added to the error.
 * 
 * @return the object, if it is of the specified type, or null if not.  
 */
@SuppressWarnings("unchecked")
private<T> T castParamOrBind( Object obj, IStatus[] retStatus, Class<?> expectedType, String prefixMessage) {
	if( obj == null)
		return null;
	
	if( obj.getClass().isAssignableFrom(expectedType))
		return (T)obj;
	
	// the user has specified the type but it type is it not what the binding expects.
	fillStatus( retStatus, prefixMessage+" is of unexpected type:" + obj.getClass());
	return null;
};

/**
 * Creates an error status with the given message and stores it in retStatus, 
 * if retStatus is not null.  

 * @param {Array.gc.databind.IStatus} retStatus - an array that will contain the status, if retStatus is not null.
 * @param {string} message - the error message. 
 */
gc.databind.AbstractBindAction.prototype.fillStatus = function(retStatus, message) 
{
	if( retStatus != null && retStatus.length > 0) 
	{
		retStatus[0] = gc.databind.AbstractStatus.createErrorStatus(message);
	}
};

/**
 * By default, if a parameter with a given name is not present, the model is  
 * requested for a binding with name "actionBindName.parameterName" and its value is 
 * used as value of the parameter. 
 * 
 * Derived classes can override this method to map the parameter name 
 * to a different binding name.  
 * 
 * @return {string} the bind name for this parameter name. 
 */
gc.databind.AbstractBindAction.prototype.getBindForParameter = function(paramName) 
{
	return getName()+"."+paramName;
};

/**
 * Extracts all strings contained within an array with objects of any type.
 * 
 * @param {Array.} arrayList - the input array. 
 * @return {Array.string} an array of stings contained within the input array.
 */
gc.databind.AbstractBindAction.prototype.toStringArray = function(arrayList) 
{
	var stringArray = [];
	if( arrayList != null)
	{
		for( var i = 0; i < arrayList.length; i++)
		{
			stringArray.push(arrayList[i].toString() || "");
		}
	return stringArray;
};
