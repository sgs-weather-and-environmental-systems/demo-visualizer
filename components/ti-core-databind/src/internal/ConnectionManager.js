/*****************************************************************
 * Copyright (c) 2016 Texas Instruments and others
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
    var Sequencer = function() 
    {
        this._deferred = Q.defer();
        this._scheduler = this._deferred.promise;
        this._events = {};
     };
    
    Sequencer.prototype.start = function()
    {
        this._deferred.resolve();
    };
    
    var doStart = function(name)
    {
        if (name)
        {
            var event = this._events[name];
            if (!event)
            {
                name = name + '.$after';
                event = this._events[name];
            }
            if (event)
            {
                window.setTimeout(function()
                {
                    this._events[name] = undefined;

                    console.log('starting event ' + name);

                    event.start();
                }.bind(this), 1);
                event.then(doStart.bind(this, name + '.$after'));
                return event._scheduler;
            }
        }
    };
    
    Sequencer.prototype.when = function(eventName)
    {
        this.schedule(eventName);
        return this._events[eventName];
    };
    
    Sequencer.prototype.after = function(eventName)
    {
        return this.when(eventName + '.$after');
    };
    
    Sequencer.prototype.then = function(action)
    {
        if (action instanceof String)
        {
            this.schedule(action);
        }
        else
        {
            this._scheduler = this._scheduler.finally(action);
        }
        return this;
    };
    
    Sequencer.prototype.schedule = function(eventName, action)
    {
        var event = this._events[eventName];
        if (!event)
        {
            this.then(doStart.bind(this, eventName));
            event = new Sequencer();
            if (action)
            {
                event.then(action);
            }
            this._events[eventName] = event;
        }
        return this;
    };
    
    var DISCONNECTED = 'disconnected';
    var CONNECTED = 'connected';
    var CONNECTING = 'connecting';
    var DISCONNECTING = 'disconnecting';
    
    var ITargetConnection = function()
    {
    };
    
    ITargetConnection.prototype.doConnect = function() {};
    ITargetConnection.prototype.doDisconnect = function() {};
    ITargetConnection.prototype.shouldAutoConnect = function() {};
    
    var AbstractTargetConnection = function()
    {
        this.status = DISCONNECTED;
    };
    
    AbstractTargetConnection.prototype = new ITargetConnection();
    
    AbstractTargetConnection.prototype.canConnect = function()
    {
        return this.status === DISCONNECTED || this.status === DISCONNECTING;
    };
    
    AbstractTargetConnection.prototype.shouldAutoConnect = function() 
    {
        return this.status === CONNECTING || this.status === CONNECTED;
    };
    
    var resetOnEventHandlers = function()
    {
        this.onDisconnected = AbstractTargetConnection.prototype.onDisconnected;
        this.onConnected = AbstractTargetConnection.prototype.onConnected;
    };
    
    var completed = Q();
    var listSerialPortsPromise = Q();
    var listUsbHidPortsPromise = Q();

    AbstractTargetConnection.prototype.connect = function(selectedDevice, preventClientAgentInstallCallback) 
    {
        if (this.canConnect())
        {
            this.status = CONNECTING;
            this._progressData = {};
            var self = this;
            return listSerialPortsPromise.finally(function() 
            {
                return self.doConnect(selectedDevice, preventClientAgentInstallCallback).then(function() 
                {
                    if (self.status === CONNECTING)
                    {
                        self.status = CONNECTED;
                    }
                    if (self.setConnectedState)
                    {
                        self.onConnected = self.setConnectedState.bind(self, true);
                        self.onDisconnected = self.setConnectedState.bind(self, false);
                    }
                    else
                    {
                        resetOnEventHandlers.call(self);
                    }
                }).fail(function(msg) 
                {
                    resetOnEventHandlers.call(self);
                    self.disconnect();
                    throw msg;
                });
            });
        }
        return completed;
    };
    
    AbstractTargetConnection.prototype.disconnect = function() 
    {
        if (!this.canConnect())
        {
            gc.connectionManager.setConnectedState(this.id, false);
            
            this.onDisconnected(); // force the current operation i.e., connect() to terminate, so the disconnect can proceed.
            this.status = DISCONNECTING;
            var self = this;
            return this.doDisconnect().finally(function() 
            {
                if (self.status === DISCONNECTING)
                {
                    self.status = DISCONNECTED;
                }
                resetOnEventHandlers.call(self);
            });
        }
        return completed;
    };
    
    var noop = function() {};
    
    AbstractTargetConnection.prototype.onConnected = noop;
    AbstractTargetConnection.prototype.onDisconnected = noop;
    
    AbstractTargetConnection.prototype.doConnect = function(selectedDevice, preventClientAgentInstallCallback)
    {
        return Q.promise(function(resolve, reject) 
        {
            this.onDisconnected = reject;
            this.onConnected = resolve;
            
            this.startConnecting(selectedDevice, preventClientAgentInstallCallback);
        }.bind(this));
    };
    
    AbstractTargetConnection.prototype.doDisconnect = function()
    {
        return Q.promise(function(resolve, reject) 
        {
            this.onDisconnected = resolve;
            this.onConnected = noop;
            
            this.startDisconnecting();
        }.bind(this));
    };
    
    AbstractTargetConnection.prototype.startConnecting = function()
    {
        this.onConnected();
    };
    
    AbstractTargetConnection.prototype.startDisconnecting = function()
    {
        this.onDisconnected();
    };
    
    var backplaneConnectionCount = 0;
    AbstractTargetConnection.prototype.startBackplane = function(deviceInfo, preventClientAgentInstallCallback)
    {
        var appBackplane = gc.services['ti-core-backplane'];
        var designerBackplane = window.parent.gc && window.parent.gc.services && window.parent.gc.services['ti-core-backplane'];
        if (designerBackplane && designerBackplane !== appBackplane)
        {
            designerBackplane._inDesigner = true;
            gc.services['ti-core-backplane'] = designerBackplane;
        }
        if (designerBackplane && this.backplane && this.backplane !== designerBackplane)
        {
            this.backplane = designerBackplane;
        }

        gc.connectionManager.sequencer.schedule('backplaneReady').schedule('downloadProgram').schedule('targetReady');

        if (backplaneConnectionCount === 0)
        {
            var backplane = gc.services['ti-core-backplane'];
            gc.connectionManager.setProgressMessage(this.id, 'Connecting to TI Cloud Agent...');
            backplane.connect(deviceInfo, preventClientAgentInstallCallback);
            this.waitForEvent(backplane, 'connectionStatusChanged', 'isConnectedToCloudAgent', true).then(
                gc.connectionManager.setProgressMessage.bind(gc.connectionManager, this.id, 'Connected to TI Cloud Agent.'));
        }
        backplaneConnectionCount++;
    };
    
    AbstractTargetConnection.prototype.stopBackplane = function()
    {
        backplaneConnectionCount--;
        if (backplaneConnectionCount === 0)
        {
            gc.services['ti-core-backplane'].disconnect();
        }
    };
    
    AbstractTargetConnection.prototype.waitForEvent = function(target, eventName, passPropertyName, passPropertyValue, failPropertyName, failPropertyValue)
    {
        return Q.promise(function(resolve, reject) 
        {
            console.log('waitForEvent started for ' + eventName);
            
            // if we are not trying to connect, then abort this operation too.
            if (!this.shouldAutoConnect())
            {
                console.log('waitForEvent cancelled for ' + eventName);
                reject();
                return;
            }
         
            var listener;
            
            // chain the disconnected handler to quit the waitForEvent promise if the user disconnects in the middle of it.
            var disconnectedHandler = this.onDisconnected;
            this.onDisconnected = function() 
            {
                target.removeEventListener(eventName, listener);
                this.onDisconnected = disconnectedHandler;
                console.log('waitForEvent aborted for ' + eventName);
                reject();
                disconnectedHandler();
            }.bind(this);
            
            listener = function() 
            {
                if (!passPropertyName || target[passPropertyName] === passPropertyValue)
                {
                    target.removeEventListener(eventName, listener);
                    console.log('waitForEvent resolved for ' + eventName);
                    this.onDisconnected = disconnectedHandler;
                    resolve();
                }
                if (failPropertyName && target[failPropertyName] === failPropertyValue)
                {
                    target.removeEventListener(eventName, listener);
                    this.onDisconnected = disconnectedHandler;
                    console.log('waitForEvent failed for ' + eventName);
                    reject();
                }
            }.bind(this);
            target.addEventListener(eventName, listener);
            if (passPropertyName)
            {
                listener();
            }
        }.bind(this));
    };
    
    var connections = {};
    var iconClickedEventListener;
    
    var doComputeConnectedState = function()
    {
        var result = true;
        for(var id in connections)
        {
            if (connections.hasOwnProperty(id))
            {
                var connection = connections[id];
                if (connection && connection._progressData && connection._progressData.connectedState !== undefined)
                {
                    result = result && connection._progressData.connectedState;
                }
            }
        }
        return result;
    };
    
    var doComputeConnectionMessage = function()
    {
        var result = '';
        for(var id in connections)
        {
            if (connections.hasOwnProperty(id))
            {
                var connection = connections[id];
                if (connection && connection._progressData && connection._progressData.connectionMessage)
                {
                    if (result.length > 0) 
                    {
                        result += ', ';
                    }
                    result += connection._progressData.connectionMessage;
                }
            }
        }
        if (result.length === 0)
        {
            var backplane = gc.services['ti-core-backplane'];
            if (backplane)
            {
                result = backplane.statusString1;
            }
        }
        return result;
    };
    
    var doUpdateStatusBar = function()
    {
        var statusBar = gc && gc.services && gc.services['ti-widget-statusbar'];
        
        if (statusBar)
        {
            var status = gc.connectionManager.status;
            var progressData = gc.connectionManager._progressData;
            
            var backplane = gc.services['ti-core-backplane'];
            
            if (!backplane)
            {
                // setup click handler to connect or disconnect based on current state. 
                if (iconClickedEventListener)
                {
                    statusBar.removeEventListener("iconclicked", iconClickedEventListener);
                }                    
                if (status === DISCONNECTED || status === DISCONNECTING)
                {
                    iconClickedEventListener = gc.connectionManager.connect.bind(gc.connectionManager);
                    statusBar.addEventListener("iconclicked", iconClickedEventListener);
                    statusBar.setIconName('ti-core-icons:nolink');
                }
                else
                {
                    iconClickedEventListener = gc.connectionManager.disconnect.bind(gc.connectionManager);
                    statusBar.addEventListener("iconclicked", iconClickedEventListener);
                    statusBar.setIconName('ti-core-icons:link');
                }
            }
            
            if (status === CONNECTED)
            {
                var isConnected = doComputeConnectedState();
                statusBar.statusString2 = isConnected ? "Hardware Connected." : (progressData.lastProgressMessage || "Hardware not Connected.");
                statusBar.tooltip1 = statusBar.tooltip2 = statusBar.statusString1 = doComputeConnectionMessage();
                
                if (backplane)
                {
                    if (isConnected)
                    {
                        backplane.restoreIcon();
                    }
                    else if (isConnected === false) 
                    {
                        backplane.setIcon('ti-core-icons:link-off');
                    }
                }
                else 
                {
                    statusBar.setIconName(isConnected ? 'ti-core-icons:link' : 'ti-core-icons:link-off');
                }
            }
            else if (status === CONNECTING)
            {
                statusBar.statusString1 = doComputeConnectionMessage();
                if (progressData.lastErrorMessage)
                {
                    statusBar.statusString2 = progressData.lastErrorMessage;
                    statusBar.tooltip2 = progressData.lastErrorTooltip || "";
                    
                    if (progressData.lastErrorToast && statusBar.showToastMessage)
                    {
                        statusBar.showToastMessage(progressData.lastErrorMessage, progressData.lastErrorToast);
                        progressData.lastErrorToast = undefined;
                    }
                }
                else if (progressData.lastProgressMessage !== statusBar.statusString1)
                {
                    statusBar.statusString2 = progressData.lastProgressMessage || ""; 
                    statusBar.tooltip2 = progressData.lastProgressTooltip || ""; 
                }
                else
                {
                    statusBar.statusString2 = ""; 
                    statusBar.tooltip2 = ""; 
                }
            }
            else
            {
                statusBar.tooltip1 = statusBar.statusString1 = "";
                if (progressData && progressData.lastErrorMessage)
                {
                    statusBar.statusString2 = progressData.lastErrorMessage;
                    statusBar.tooltip2 = progressData.lastErrorTooltip || "";
                }
                else 
                {
                    statusBar.statusString2 = "Hardware not Connected.";
                    statusBar.tooltip2 = "";
                }
                
                if (backplane)
                {
                    statusBar.setIconName('ti-core-icons:nolink');
                }
            }
        }
    };
    
    var doSetConnectionMessage = function(model, message, tooltip)
    {
        model._progressData = model._progressData || {};  
        if (model._progressData.connectionMessage !== message) 
        {
            model._progressData.connectionMessage = message;
            model._progressData.connectionTooltip = tooltip;
            if (message) 
            {
                model.addConsoleMessage('connecting to ' + message, 'debug');
            }
            else
            {
                doUpdateStatusBar();
            }
        }
    };
    
    var skipHardwareNotConnectedMessage = false;
    
    var doSetConnectedState = function(model, connected) 
    {
        if (model)
        {
            model._progressData = model._progressData || {};
            if (model._progressData.connectedState !== connected)
            {
                var displayProgress = connected || (model._progressData.connectedState !== undefined && !skipHardwareNotConnectedMessage);
                model._progressData.connectedState = connected;
                if (displayProgress)
                {
                    model.addConsoleProgress(connected ? 'Hardware Connected.' : 'Hardware Not Connected.');
                }
                else
                {
                    doUpdateStatusBar();
                }
            }
        }
    };
    
    var ConnectionManager = function() 
    {
        AbstractTargetConnection.call(this);
    };
    
    ConnectionManager.prototype = new AbstractTargetConnection();
    
    var events = {};
    
    ConnectionManager.prototype.addEventListener = function(event, handler)
    {
        events[event] = events[event] || [];
        events[event].push(handler);
    };
    
    ConnectionManager.prototype.removeEventListener = function(event, handler)
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
    
    var fireEvent = function(event, detail)
    {
        var listeners = events[event] || [];
        for(var i = listeners.length; i-- > 0; )
        {
            var listener = listeners[i];
            try 
            {
                listener.call(listener, { detail: detail }, detail);
            }
            catch(e)
            {
                console.error(e);
            }
        }
    };
    
    /*                                                 Each TargetConnection                     
     *     ConnectionMangager |   CONNECTED      CONNECTING    DISCONNECTED   DISCONNECTING
     *         ------------------------------------------------------------------------------    
     *          CONNECTED     |   CONNECTED      CONNECTING    DISCONNECTED   DISCONNECTING
     *          CONNECTING    |   CONNECTING     CONNECTING    DISCONNECTED   DISCONNECTING
     *          DISCONNECTED  |  DISCONNECTED   DISCONNNECTED  DISCONNECTED   DISCONNECTING
     *          DISCONNECTING |  DISCONNECTING  DISCONNECTING  DISCONNECTING  DISCONNECTING
     */
    var computeStatus = function()
    {
        var result = CONNECTED;
        for(var id in connections)
        {
            if (connections.hasOwnProperty(id))
            {
                var connection = connections[id];
                if (connection)
                {
                    if (result !== DISCONNECTING && connection.status !== CONNECTED)
                    {
                        if (result !== DISCONNECTED || connection.status !== CONNECTING)
                        {
                            result = connection.status;
                        }
                    }
                }
            }
        }
        this.status = result;
        fireEvent('status-changed');
        return result;
    };
    
    var createOperation = function(command) 
    {
        var cmd = command.toLowerCase(); 
        ConnectionManager.prototype['do' + command] = function(param1, param2) 
        {
            fireEvent('status-changed');
            var progressData = this._progressData || {};
            doUpdateStatusBar();
            
            var promises = [];
            for(var id in connections)
            {
                if (connections.hasOwnProperty(id))
                {
                    var connection = connections[id];
                    if (connection)
                    {
                        promises.push(connection[cmd](param1, param2));
                    }
                }
            }
            return Q.allSettled(promises).then(computeStatus.bind(this)).then(function(status) 
            {
                doUpdateStatusBar();
                if (status !== CONNECTED)
                {
                    throw "One or more models failed to connect without error";
                }
            });
        };
    };
    
    createOperation('Connect');
    createOperation('Disconnect');
    
    ConnectionManager.prototype.register = function(id, connector)
    {
        if (id)
        {
            connections[id] = connector;
        }
    };

    ConnectionManager.prototype.unregister = function(id) 
    {
        if (id)
        {
            this.register(id, null);
        }
    };
    
    var sequencer = Q();
    
    ConnectionManager.prototype.then = function(doNext)
    {
        return this.sequencer.then(doNext);
    };
    
    var scheduledEvents = {};
    ConnectionManager.prototype.schedule = function(eventName, action)
    {
        return this.sequencer.schedule(eventName, action);
    };
    
    ConnectionManager.prototype.shouldAutoConnect = function(model)
    {
        if (model)
        {
            var connector = connections[model];
            return connector && connector.shouldAutoConnect();
        }
        return backplaneConnectionCount > 0;
    };
    
    ConnectionManager.prototype.autoConnect = function()
    {
        this.schedule('autoconnect', function() 
        {
            return gc.fileCache.readJsonFile('project.json').then(function(manifest) 
            {
                var deviceInfo;
                // Node webkit specific code for auto-connect
                if (manifest.device_name) 
                {
                    deviceInfo = 
                    {
                        boardName: manifest.board_name,
                        deviceName: manifest.device_name,
                        fileName: manifest.target_out_filename,
                        fileFolderName: manifest.target_out_foldername
                    };
                }
                if (!manifest.disableAutoConnect) 
                {
                    gc.connectionManager.connect(deviceInfo);
                }
                else
                {
                    gc.connectionManager.startBackplane(deviceInfo);
                }
            });
        });
    };
    
    ConnectionManager.prototype.saveSettingsToProjectDatabase = function(projectName)
    {
        var properties = {};
        var promises = [];
        for(var id in connections)
        {
            if (connections.hasOwnProperty(id))
            {
                var connection = connections[id];
                if (connection)
                {
                    properties[id] = properties[id] || {};
                    var promise = connection.saveSettingsToProjectDatabase(properties[id], projectName);
                    if (promise)
                    {
                        promises.push(promise);
                    }
                }
            }
        }
        var result = Q.defer();
        promises.push(result.promise);
        Q.all(promises).then(function() 
        {
            var projectPath = projectName ? gc.designer.workspace.folderName + '/' + projectName +'/' : "";
            return gc.fileCache.writeJsonFile(projectPath + 'targetsymbols.json', properties);
        });
        return result;
    };
    
    ConnectionManager.prototype.sequencer = new Sequencer();
    ConnectionManager.prototype.sequencer.start();
    
    ConnectionManager.prototype.getListOfAvailableSerialPorts = function(rescan, deviceName, defaultBaudRate)
    {
        if (!listSerialPortsPromise.isPending())
        {
            listSerialPortsPromise = Q.promise(function(resolve, reject)
            {
                window.setTimeout(function() 
                {
                    var backplane = window.parent.gc && window.parent.gc.services && window.parent.gc.services['ti-core-backplane'];
                    if (!backplane)
                    {
                        reject('missing designer backplane.');
                    }
                    else
                    {
                        this.startBackplane(undefined, function() 
                        {
                            reject('cloud agent is not up-to-date');
                            return false;
                        });
                        
                        var listener = function() 
                        {
                            resolve(backplane, listener);
                        };
                        
                        backplane.addEventListener('connectionStatusChanged', listener);
                        if (backplane.currentState.name === 'ready' || backplane.currentState.name === 'disconnected')
                        {
                            listener();
                        }
                    }
                }.bind(this), 1);
            }.bind(this)).then(function(backplane, listener) 
            {
                backplane.removeEventListener('connectionStatusChanged', listener);
                if (backplane.currentState.name === 'ready')
                {
                    return backplane.listSerialPorts(rescan, deviceName, defaultBaudRate);
                }
            }).finally(function() 
            {
                this.stopBackplane();
            }.bind(this));
        }
    
        return listSerialPortsPromise;
    };
    ConnectionManager.prototype.getListOfAvailableUsbHidPorts = function(rescan, vendorIdFilter)
    {
        if (!listUsbHidPortsPromise.isPending())
        {
            listUsbHidPortsPromise = Q.promise(function(resolve, reject)
            {
                window.setTimeout(function()
                {
                    var backplane = window.parent.gc && window.parent.gc.services && window.parent.gc.services['ti-core-backplane'];
                    if (!backplane)
                    {
                        reject('missing designer backplane.');
                    }
                    else
                    {
                        this.startBackplane(undefined, function()
                        {
                            reject('cloud agent is not up-to-date');
                            return false;
                        });

                        var listener = function()
                        {
                            resolve(backplane, listener);
                        };

                        backplane.addEventListener('connectionStatusChanged', listener);
                        if (backplane.currentState.name === 'ready' || backplane.currentState.name === 'disconnected')
                        {
                            listener();
                        }
                    }
                }.bind(this), 1);
            }.bind(this)).then(function(backplane, listener)
            {
                backplane.removeEventListener('connectionStatusChanged', listener);
                if (backplane.currentState.name === 'ready')
                {
                    return backplane._listUsbHidPorts(rescan, vendorIdFilter);
                }
            }).finally(function()
            {
                this.stopBackplane();
            }.bind(this));
        }

        return listUsbHidPortsPromise;
    };
    ConnectionManager.prototype.reconnectBackplane = function()
    {
        var that = this;
        if (this.shouldAutoConnect())
        {
            var backplane = gc.services['ti-core-backplane'];
            
            skipHardwareNotConnectedMessage = true;
            
            backplane.disconnect();
            return this.waitForEvent(backplane, 'connectionStatusChanged', 'isConnectedToCloudAgent', false).then(function() 
            {
                window.setTimeout(function()
                {
                    skipHardwareNotConnectedMessage = false;
                    if (that.shouldAutoConnect())
                    {
                        backplane.connect();
                    }
                }, 2500);
            }).fail(function() {
                skipHardwareNotConnectedMessage = false;
            });
        }
    };
    
    ConnectionManager.prototype.addConsoleMessage = function(message, type, id, tooltip, toast)
    {
        this._progressData = this._progressData || {};
        var model = connections[id];
        if (type === 'error' || toast)
        {
            this._progressData.lastErrorMessage = message;
            this._progressData.lastErrorTooltip = tooltip;
            this._progressData.lastErrorToast = toast;
        }
        else if (type === 'info')
        {
            this._progressData.lastProgressMessage = message;
            this._progressData.lastProgressTooltip = tooltip;
        }
        if (message)
        {
            fireEvent('console-output', { message: message, type: type || 'data', id: id, tooltip: tooltip, showToast: toast } );
            if (type && (type === 'info' || type === 'error'))
            {
                doUpdateStatusBar();
            }
        }
    };
    
    ConnectionManager.prototype.setConnectionMessage = function(modelId, message, tooltip)
    {
        var model = connections[modelId];
        if (model) 
        {
            doSetConnectionMessage(model, message, tooltip);
        }
    };
    
    ConnectionManager.prototype.setProgressMessage = function(modelId, message, tooltip, toast) 
    {
        var model = connections[modelId];
        if (model) 
        {
            if (toast)
            {
                model.addConsoleError(message, tooltip, toast);
            }
            else
            {
                model.addConsoleProgress(message, tooltip);
            }
        }
    };
    
    ConnectionManager.prototype.setErrorMessage = function(modelId, message, tooltip, toast)
    {
        var model = connections[modelId];
        if (model)
        {
            model.addConsoleError(message, tooltip, toast);
        }
    };
    
    ConnectionManager.prototype.setConnectedState = function(modelId, connected) 
    {
        var model = connections[modelId];
        if (model) 
        {
            doSetConnectedState(model, connected);
        }
    };
    
    ConnectionManager.prototype.onDisconnected = function(modelId)
    {
        var model = connections[modelId];
        if (model) 
        {
            model.onDisconnected();
        }
    };
    
    ConnectionManager.prototype.onConnected = function(modelId)
    {
        var model = connections[modelId];
        if (model) 
        {
            model.onConnected();
        }
    };
    
    ConnectionManager.prototype.getDefaultCcxmlFile = function(modelId, name)
    {
        var model = connections[modelId];
        if (model) 
        {
            return model._ccxmlText && model._ccxmlText[name.toLowerCase()];
        }
    };
    
    gc.connectionManager = new ConnectionManager();
    gc.databind.internal.AbstractTargetConnection = AbstractTargetConnection;
    
    gc.connectionManager.then(function() 
    {
        if (!gc.designer)
        {
            return Q.promise(function(resolve) 
            {
                var origOnLoadHandler = window.onload;  
                var timeoutHdlr = window.setTimeout(function()
                {
                    timeoutHdlr = null;
                    resolve();
                    console.error('window.onload() never called.');
                },3000);
                window.onload = function() 
                {
                    if (origOnLoadHandler) {
                        origOnLoadHandler();
                    }
                    if (timeoutHdlr) {
                        window.clearTimeout(timeoutHdlr);
                        timeoutHdlr = null;
                    }
                    resolve();
                };
            }).fail(function(error) 
            { 
                console.error(error); 
            });
        }
    }).then('onLoad');
    
    gc.connectionManagerReady = gc.connectionManagerReady || Q.Promise(function(resolve) { gc.connectionManagerFireReady = resolve; return gc.connectionManager;});
    gc.connectionManagerFireReady(gc.connectionManager);

}());
