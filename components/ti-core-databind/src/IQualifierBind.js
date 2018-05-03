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
	/**
	 * The basic bindable object with qualifiers that derived models provide. 
	 * Qualifiers are bind names ending with ".$<qualifier>" and are model
	 * specific.  Qualifiers do not create additional bindings, but are applied
	 * to existing bindings.  For example, model.data and model.data.$readonly
	 * are the same underlying binding, and the readonly qualifier will apply to both.
	 * 
	 *	@interface
	 */
	gc.databind.IQualifierBind = function() 
	{
	};

	/**
	 * Add a qualifier to this bindable object.  All qualifier names will be converted to lower case.
	 * to minimize errors to due mis-typing names.  
	 *  
	 * @param {string} qualifier - the lower case name of the qualifier to add to this binding. 
	 */
	gc.databind.IQualifierBind.prototype.addQualifier = function(qualifier)
	{
	};
}());
