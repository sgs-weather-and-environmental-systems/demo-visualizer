/*******************************************************************************
 * Copyright (c) 2016 Texas Instruments and others All rights reserved. This
 * program and the accompanying materials are made available under the terms of
 * the Eclipse Public License v1.0 which accompanies this distribution, and is
 * available at http://www.eclipse.org/legal/epl-v10.html
 * 
 * Contributors: Paul Gingrich, - Initial API and implementation
 ******************************************************************************/
var gc = gc || {};
gc.databind = gc.databind || {};

if (gc.databind.WidgetBindingManager === undefined)  // ensure this .js file is only executed once, if loaded two times or more.
{
    var Operation = function()
    {
    };
    Operation.prototype.undoToggle = true;

    Operation.prototype.performUndoRedo = function()
    {
        if (this.undoToggle)
        {
            this.undo();
        }
        else
        {
            this.redo();
        }
        this.undoToggle = !this.undoToggle;
    };

    var RenameWidgetOperation = function(manager, oldWidgetId, newWidgetId)
    {
        this.manager = manager;
        this.oldWidgetId = oldWidgetId;
        this.newWidgetId = newWidgetId;

        this.doRenameWidget(oldWidgetId, newWidgetId);
    };
    RenameWidgetOperation.prototype = new Operation();

    RenameWidgetOperation.prototype.undo = function()
    {
        this.doRenameWidget(this.newWidgetId, this.oldWidgetId);
    };

    RenameWidgetOperation.prototype.redo = function()
    {
        this.doRenameWidget(this.oldWidgetId, this.newWidgetId);
    };

    RenameWidgetOperation.prototype.doRenameWidget = function(oldWidgetId, newWidgetId)
    {
        var itemsToChange = [];
        for ( var id in this.manager.widgetBindings)
        {
            if (this.manager.widgetBindings.hasOwnProperty(id))
            {
                var binding = this.manager.widgetBindings[id]._jsonBindingData_;
                if (binding)
                {
                    if (binding.widgetId === oldWidgetId)
                    {
                        itemsToChange.push(binding);
                    }

                    binding.serverBindName = binding.serverBindName.split('widget.' + oldWidgetId + '.').join('widget.' + newWidgetId + '.');
                }
            }
        }

        for (var i = itemsToChange.length; i-- > 0;)
        {
            var item = itemsToChange[i];
            this.manager.deleteBinding(oldWidgetId, item.propertyName);
            this.manager.deleteBinding(newWidgetId, item.propertyName);
            this.manager.createBinding(newWidgetId, item.propertyName, item.serverBindName);
        }
    };

    var SetBindingOperation = function(manager, widgetId, propertyName, bindingExpression, oldBindingExpression)
    {
        this.widgetId = widgetId;
        this.propertyName = propertyName;
        this.bindingExpression = bindingExpression;
        this.oldBindingExpression = oldBindingExpression;
        this.manager = manager;

        this.redo();
    };

    SetBindingOperation.prototype = new Operation();

    SetBindingOperation.prototype.undo = function()
    {
        this.doSetBinding(this.widgetId, this.propertyName, this.oldBindingExpression || "");
    };

    SetBindingOperation.prototype.redo = function()
    {
        this.doSetBinding(this.widgetId, this.propertyName, this.bindingExpression || "");
    };

    SetBindingOperation.prototype.doSetBinding = function(widgetId, propertyName, bindingExpression)
    {
        this.manager.deleteBinding(widgetId, propertyName);

        if (bindingExpression == "")
        {
            return;
        }

        if (bindingExpression.indexOf('$.target_device.') === 0)
        {
            bindingExpression = bindingExpression.substring('$.target_device.'.length);
        }
        else if (bindingExpression.indexOf('$.') === 0)
        {
            bindingExpression = 'widget.' + bindingExpression.substring(2);
        }
        else if (bindingExpression.indexOf('prop.') !== 0)
        {
            bindingExpression = 'prop.' + bindingExpression;
        }

        return this.manager.createBinding(widgetId, propertyName, bindingExpression);
    };

    var RemoveAllBindingsOperation = function(manager, widgetId)
    {
        this.bindings = [];
        for ( var bind in manager.widgetBindings)
        {
            if (manager.widgetBindings.hasOwnProperty(bind))
            {
                var jsonBinding = manager.widgetBindings[bind]._jsonBindingData_;
                if (widgetId) 
                {
                    if (jsonBinding.widgetId === widgetId || jsonBinding.serverBindName.indexOf('widget.' + widgetId) >= 0)
                    {
                        this.bindings.push(manager.widgetBindings[bind]._jsonBindingData_);
                    }
                }
            }
        }
        this.manager = manager;

        this.redo();
    };

    RemoveAllBindingsOperation.prototype = new Operation();

    RemoveAllBindingsOperation.prototype.undo = function()
    {
        for ( var bind in this.bindings)
        {
            if (this.bindings.hasOwnProperty(bind))
            {
                var binding = this.bindings[bind];
                this.manager.createBinding(binding.widgetId, binding.propertyName, binding.serverBindName);
            }
        }
    };

    RemoveAllBindingsOperation.prototype.redo = function()
    {
        for ( var bind in this.bindings)
        {
            if (this.bindings.hasOwnProperty(bind))
            {
                var binding = this.bindings[bind];
                this.manager.deleteBinding(binding.widgetId, binding.propertyName);
            }
        }
    };

    /**
     * Class to manage widget bindings. This includes creating, destroying, and
     * serializing them to JSON files.
     * 
     * @constructor
     * 
     * @param {gc.databind.IBindProvider} [bindingProvider] - used to create the
     *        bindings on the fly, if not provided, bindings will just be stored
     *        for serialization purposes.
     */
    gc.databind.WidgetBindingManager = function(undoRedoManager, bindingProvider)
    {
        this.undoRedoManager = undoRedoManager;
        this.bindingProvider = bindingProvider;
        this.widgetBindings = {};
        this.activeProject = gc.designer.project.folderName;  
    };

    gc.databind.WidgetBindingManager.prototype.createBinding = function(widgetId, propertyName, bindingExpression)
    {
        if (bindingExpression) 
        {
            var id = widgetId + '.' + propertyName;

            var binder;
            if (this.bindingProvider)
            {
                binder = this.bindingProvider.bind('widget.' + id, bindingExpression);
            }
            binder = binder || {};

            binder._jsonBindingData_ =
            {
                widgetId : widgetId,
                propertyName : propertyName,
                serverBindName : bindingExpression
            };
            this.widgetBindings[id] = binder;
        }
    };
    
    gc.databind.WidgetBindingManager.prototype.renameProperty = function(widgetId, oldPropertyName, newPropertyName)
    {
        var result = false;
        for ( var id in this.widgetBindings)
        {
            if (this.widgetBindings.hasOwnProperty(id))
            {
                var binding = this.widgetBindings[id]._jsonBindingData_;
                if (binding)
                {
                    if (binding.widgetId === widgetId)
                    {
                        if (binding.propertyName === oldPropertyName)
                        {
                            binding.propertyName = newPropertyName;
                            result = true;
                        }
                    }
                    else 
                    {
                        var match = 'widget.' + widgetId + '.' + oldPropertyName;
                        var replaceWith = 'widget.' + widgetId + '.' + newPropertyName;
                        var newServerBindName = binding.serverBindName.split(match).join(replaceWith);
                        if (newServerBindName !== binding.serverBindName)
                        {
                            binding.serverBindName = newServerBindName;
                            result = true;
                        }
                    }
                }
            }
        }
        return result;
    };

    /**
     * Method to create a binding. If a binding already exists for the selected
     * widget, then it is first deleted. if The bindingExpression is empty, the
     * binding will be deleted instead of created.
     * 
     * @param {string} widgetId - the unique identifier of the widget to bind
     *        to.
     * @param {string} propertyName - the widget property to bind to.
     * @param {string} bindingExpression - the target bind expression.
     */
    gc.databind.WidgetBindingManager.prototype.setBinding = function(widgetId, propertyName, bindingExpression)
    {
        this.undoRedoManager.push(new SetBindingOperation(this, widgetId, propertyName, bindingExpression, this.getBinding(widgetId, propertyName)));
    };

    /**
     * Method to retrieve the binding expression for a particular widget
     * property.
     * 
     * @param {string} widgetId - the unique identifier of the widget to bind
     *        to.
     * @param {string} propertyName - the widget property to bind to.
     * @return {string} the binding expression found or undefined if there is
     *         not binding for the particular widget.
     */
    gc.databind.WidgetBindingManager.prototype.getBinding = function(widgetId, propertyName)
    {
        if (arguments.length === 1)
        {
            propertyName = arguments[0].name;
            widgetId = arguments[0].obj;
        }

        if (!widgetId)
        {
            return undefined;
        }

        var id = (typeof widgetId === 'object' ? widgetId.id : widgetId) + '.' + propertyName;
        var binder = this.widgetBindings[id];
        var bindingExpression = binder ? binder._jsonBindingData_.serverBindName : undefined;
        if (bindingExpression)
        {
            if (bindingExpression.indexOf('prop.') === 0)
            {
                bindingExpression = bindingExpression.substring('prop.'.length);
            }
            else if (bindingExpression.indexOf('widget.') === 0)
            {
                bindingExpression = '$.' + bindingExpression.substring('widget.'.length);
            }
            else
            {
                bindingExpression = '$.target_device.' + bindingExpression;
            }
        }
        return bindingExpression;
    };

    /**
     * Method to remove a binding created with the createBinding method.
     * 
     * @param {string} widgetId - the unique identifier of the widget to bind
     *        to.
     * @param {string} propertyName - the widget property to bind to.
     */
    gc.databind.WidgetBindingManager.prototype.deleteBinding = function(widgetId, propertyName)
    {
        var id = widgetId + '.' + propertyName;
        var binder = this.widgetBindings[id];
        if (binder)
        {
            delete this.widgetBindings[id];
            if (this.bindingProvider)
            {
                this.bindingProvider.deleteBind(binder);
            }
        }
    };

    gc.databind.WidgetBindingManager.prototype.renameWidget = function(oldWidgetId, newWidgetId)
    {
        if (this.undoRedoManager)
        {
            this.undoRedoManager.pushGroup(new RenameWidgetOperation(this, oldWidgetId, newWidgetId));
        }
    };

    gc.databind.WidgetBindingManager.prototype.deleteWidget = function(widgetId)
    {
        var deleteAllOperation = new RemoveAllBindingsOperation(this, widgetId);
        if (this.undoRedoManager)
        {
            this.undoRedoManager.pushGroup(deleteAllOperation);
        }
    };

    /**
     * Method to serialize all widget bindings to a json formatted file. If a
     * document object is provided, then only bindings that have widgetIds that
     * are present in the document will be saved. The result, is pruning dead
     * bindings from the saved Json File.
     * 
     * @param {string} jsonFile - the relative path of the file to save the
     *        bindings to.
     * @param {object} [document] - the document to verify widget Id's against
     *        to prune bindings on save.
     */
    gc.databind.WidgetBindingManager.prototype.saveBindingsToFile = function(jsonFile, document)
    {
        var jsonObject =
        {
            widgetBindings : []
        };

        for ( var id in this.widgetBindings)
        {
            if (this.widgetBindings.hasOwnProperty(id))
            {
                var binding = this.widgetBindings[id]._jsonBindingData_;
                if (binding && (!document || document.querySelector('#' + binding.widgetId)))
                {
                    jsonObject.widgetBindings.push(binding);
                }
            }
        }

        var jsonFilePath = this.activeProject + '/' + jsonFile;

        return Q.promise(function(resolve)
        {
            resolve(jsonObject);

        }).then(function(data)
        {
            if (data.widgetBindings.length > 0)
            {
                return gc.fileCache.writeJsonFile(jsonFilePath, data);
            }
        });
    };

    /**
     * Method to serialize all widget bindings from a json formatted file.
     * 
     * @param {string} jsonFile - the relative path of the file to load the
     *        bindings to.
     */
    gc.databind.WidgetBindingManager.prototype.loadBindingsFromFile = function(jsonFile, activeProjectPath)
    {
        var that = this;
        that.widgetBindings = {};

        if ((activeProjectPath) && (activeProjectPath !== this.activeProject)) {
                this.activeProject = activeProjectPath;
        }
        var jsonFilePath = this.activeProject + '/' + jsonFile;

        return gc.fileCache.readJsonFile(jsonFilePath).then(function(data)
        {
            for ( var prop in data.widgetBindings)
            {
                if (data.widgetBindings.hasOwnProperty(prop))
                {
                    var wb = data.widgetBindings[prop];

                    that.createBinding(wb.widgetId, wb.propertyName, wb.serverBindName);
                }
            }
        }).fail(function()
        {
        });
    };

    var addDetachListener = function(target, handler)
    {
        // hook the target's detachedCallback method to fire a
        // designerDetachEvent
        var baseApi = target.detachedCallback;
        if (baseApi)
        {
            baseApi = target.detached;
            if (!target._ti_fireDetachHandler)
            {
                target._ti_fireDetachHandler = function()
                {
                    this.fire('designerDetachEvent');
                    if (baseApi)
                    {
                        baseApi.apply(this, arguments);
                    }

                };
                target.detached = target._ti_fireDetachHandler;
            }
            target.addEventListener('designerDetachEvent', handler);
        }
    };

    var addBindListener = function(widget, widgetProperty, target, targetProperty)
    {
        if (widget.addEventListener)
        {
            var changedPropertyEventName = Polymer.CaseMap.camelToDashCase(widgetProperty) + '-changed';
            var propertyChangedListener = function(event)
            {
                var oldValue = target[targetProperty];
                var newValue = event.detail.value;
                if (oldValue != newValue)
                {
                    target[targetProperty] = newValue;
                }
            };
            widget.addEventListener(changedPropertyEventName, propertyChangedListener);

            // hook the target's detachedCallback method to removeEventListener.
            var handler = function()
            {
                widget.removeEventListener('designerDetachEvent', handler);
                widget.removeEventListener(changedPropertyEventName, propertyChangedListener);

                if (target.removeEventListener)
                {
                    target.removeEventListener('designerDetachEvent', handler);
                }
            };
            addDetachListener(widget, handler);
            addDetachListener(target, handler);
        }
    };

    gc.databind.WidgetBindingManager.bindProperty = function(widget, widgetProperty, target, targetProperty)
    {
        if (widget && target) 
        {
	        if (widget.bind && widget.bindProperty) // test for Polymer 0.5 support
	        {
	            widget.bindProperty(widgetProperty, new window.PathObserver(target, targetProperty));
	        }
	        else
	        {
	            // assume Polymer 1.x supported
	            addBindListener(widget, widgetProperty, target, targetProperty);
	            addBindListener(target, targetProperty, widget, widgetProperty);
	        }
        }
    };
}
