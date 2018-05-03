/*******************************************************************************
 * Copyright (c) 2017 Texas Instruments and others All rights reserved. This
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
    gc.databind.AbstractPollingDataModel = function(name)
    {
        gc.databind.AbstractBindFactory.call(this, name);
    };
    
    gc.databind.AbstractPollingDataModel.prototype = new gc.databind.AbstractBindFactory();

    gc.databind.AbstractPollingDataModel.prototype.init = function()
    {
        gc.databind.AbstractBindFactory.prototype.init.call(this);
        
        this._modelBindings.$refresh_interval = new gc.databind.RefreshIntervalBindValue();
    };

}());
