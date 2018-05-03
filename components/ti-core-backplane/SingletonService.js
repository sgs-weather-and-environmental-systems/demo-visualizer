var gc = gc || {};
gc.services = gc.services || {};

(function() 
{
    var createTargetProperty = function(target, propName, propObj, notifyPropertyChanged)
    {
        var property = propObj.value;
        var observer = propObj.observer;
        
        Object.defineProperty(target, propName, 
        {
            get: function() 
            {
                return property;
            },
            set: function(value)
            {
                var oldValue = property;
                if (oldValue !== value)
                {
                    property = value;
                    notifyPropertyChanged(propName, value, oldValue);
                    
                    if (observer)
                    {
                        target[observer].call(target, value, oldValue);
                    }
                }
            }
        });
    };
    
    var createProxyObserver = function(target, proxy, propName, property)
    {
        var handler = property.observer || '_' + propName + 'Changed';
        property.observer = handler;
        proxy[handler] = function(newValue)
        {
            target[propName] = newValue;
        };
    };
    
    var createProxyProperty = function(target, proxy, propName)
    {
        var property = target[propName];
        Object.defineProperty(proxy, propName,
        {
            get: function()
            {
                return target[propName];
            },
            set: function(value)
            {
                if (value && typeof value === 'function')
                {
                    target[propName] = value.bind(target);
                }
                else
                {
                    target[propName] = value;
                }
            }
        });
    };
    
    var createPolymerProxy = function(target)
    {
        var proxy = {};
        
        for(var propName in target)
        {
            if (target.hasOwnProperty(propName) && propName.indexOf('_') !== 0)
            {
                var property = target[propName];
                if (property && typeof property === 'function')
                {
                    proxy[propName] = property.bind(target);
                }
                else
                {
					createProxyProperty(target, proxy, propName);
                }
            }
        }
        
        return proxy;
    };
    
    var createSingleLifecycleHandler = function(target, proxy, functionName)
    {
        var ready = false;
        var method = target[functionName];
        if (method)
        {
            proxy[functionName] = function()
            {
                if (!ready)
                {
                    ready = true;
                    method.call(target);
                }
            };
        }
    };
    
    var createEventListenerHandlers = function(target, proxyFireHandler)
    {
        var events = {};
        
        target.addEventListener = function(event, handler)
        {
            events[event] = events[event] || [];
            events[event].push(handler);
        };
        
        target.removeEventListener = function(event, handler)
        {
            var listeners = events[event] || [];
            for(var i = listeners.length; i-- > 0; )
            {
                if (listeners[i] === handler)
                {
                    listeners.splice(i, 1);
                }
            }
        };
        
        target.fire = function(event)
        {
            var listeners = events[event] || [];
            for(var i = listeners.length; i-- > 0; )
            {
                var listener = listeners[i];
                try 
                {
                    listener.call(listener, { target: target, currentTarget: target });
                }
                catch(e)
                {
                    console.error(e);
                }
            }
            
            proxyFireHandler(event);
        };
    };
    
    gc.SingletonService = function(target)
    {
        var proxy = createPolymerProxy(target);
        
        var instances = [];
        var propertyChangeHandler = function(propName, value) 
        {
            for(var i = instances.length; i-- > 0; )
            {
                instances[i][propName] = value;
            }
        };
        
        var proxyFireHandler = function(event)
        {
            for(var i = instances.length; i-- > 0; )
            {
                instances[i].fire(event);
            }
        };
        createEventListenerHandlers(target, proxyFireHandler);
        
        createSingleLifecycleHandler(target, proxy, 'created');
        createSingleLifecycleHandler(target, proxy, 'ready');
        
        proxy.attached = function() 
        {
            instances.push(this);
            
            if (instances.length === 1 && target.attached)
            {
                target.attached();
            }
        };
        
        proxy.detached = function() 
        {
            for(var i = instances.length; i-- > 0; )
            {
                if (instances[i] === this)
                {
                    instances = instances.splice(i, 1);
                }
            }
            
            if (instances.length === 0 && target.detached)
            {
                target.detached();
            }
        };
        
        var properties = target.properties;
        if (properties)
        {
            for(var propName in properties)
            {
                if (properties.hasOwnProperty(propName))
                {
					var property = properties[propName];
                    // create getters/setters for defined properties to reflect back to all instances.
                    createTargetProperty(target, propName, property, propertyChangeHandler);
                    // create polymer observers to redirect changes to the singleton service
                    createProxyObserver(target, proxy, propName, property);
                }
            }
        }
        
        target.async = Polymer.Base.async.bind(target);
        target.resolveUrl = Polymer.Base.resolveUrl.bind(target);
        
        Polymer(proxy);
    };
    
}());