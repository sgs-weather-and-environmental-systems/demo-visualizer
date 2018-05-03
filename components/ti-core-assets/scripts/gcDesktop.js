/***************************************************************************************************
 * Copyright (c) 2016 Texas Instruments and others All rights reserved. This program and the
 * accompanying materials are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors: Brian Cruickshank - Initial API and implementation
 **************************************************************************************************/
var gc = gc || {};
gc.desktop = gc.desktop || {};

	if (window.parent != window)
	{
	    window.parent.gc = window.parent.gc || {};
	    window.parent.gc.app = gc;
	}

	if (window.parent.gc)
	{
	    // take the designer from the parent iframe, if available.
	    gc.designer = gc.designer || window.parent.gc.designer;
	}
	if (window.global && global.document && global.document.gc)
	{
	    // take the designer from the global node-webkit document if available
	    gc.designer = gc.designer || global.document.gc.designer;
	}



if (gc.desktop.isDesktop === undefined)
{
    (function() // closure for private static methods and data.
    {
        gc.desktop.isDesktop = function (is_gcDesigner) {

            if ((typeof process === 'undefined') && (window.getNodeWebkit) && (window.opener)){
                 window.getNodeWebkit(window, window.opener);
            }
            var result = (typeof process !== 'undefined');

            // To use server APIs for copying files etc, enable the following line:
	        result = result && !is_gcDesigner;
            return result;
        };

        gc.desktop.isMobileDevice = function () {
            var result = false;
            if ((navigator.app) || (navigator.device)) {
                result = true;
            }

            return result;
        };

        gc.desktop.isCCS = function() {
            var hostname = window.location.hostname;
            return !gc.desktop.isDesktop() && (hostname === 'localhost' || hostname === '127.0.0.1');
        };

        // ownerWindow is typically window.opener
        var getNodeWebkit = function(windowHandle, ownerWindow){
            if (gc.desktop.isDesktop()) {
                if (!ownerWindow) {
                    ownerWindow = windowHandle.opener;
                }
                if ((ownerWindow) && (ownerWindow.process)) {
                    try {
                        windowHandle.process = ownerWindow.process;
                        windowHandle.nw = ownerWindow.nw;
                        windowHandle.require = ownerWindow.require;
                        if (ownerWindow.nw) {
                            windowHandle.nw_shell = ownerWindow.nw.Shell;
                            windowHandle.nw_window = ownerWindow.nw.Window;
                        }
                        if ((ownerWindow) && (ownerWindow.process)) {
                            windowHandle.console.log("getNodeWebkit: successfully copied over nw context.");
                        } else {
                            windowHandle.console.log("getNodeWebkit: failed to copy over nw context.");
                        }
                    }
                    catch (ex) {
                        console.log("gcDesktop.getNodeWebkit: exception = " + exception);
                    }
                }
            }
        };

        var _getNodeWebkitVersionStr = function () {
            if (!gc.desktop.isDesktop()) return null;
            var nwVer = process.versions['nw'];
            if (!nwVer) return null;
            var firstDotIndex = nwVer.indexOf(".");
            if (firstDotIndex < 0) return null;
            var secondDotIndex = nwVer.substring(firstDotIndex+1).indexOf(".") + firstDotIndex + 1;
            if (secondDotIndex < 0) return null;
            var majorMinorVer = nwVer.substring(0, secondDotIndex);
            return majorMinorVer;
        };

        var _getNodeWebkitVersionId = function () {
            if (!gc.desktop.isDesktop()) return null;
            var majorMinorVer = _getNodeWebkitVersionStr();
            if (!majorMinorVer) return 0;
            var firstDotIndex = majorMinorVer.indexOf(".");
            var majorVer = +majorMinorVer.substring(0, firstDotIndex);
            var minorVer = +majorMinorVer.substring(firstDotIndex+1);
            return majorVer * 100 + minorVer;
        };

        gc.desktop.getNodeWebkitVersionId = function(){
            return _getNodeWebkitVersionId();
        };

        gc.desktop.isDebugModeSupported = function(){
            var result = false;
            if (gc.desktop.isDesktop) {
                var nwVerId = _getNodeWebkitVersionId();
                if (nwVerId <= 12) {
                    result = true;
                }
            }
            return result;
        };
        gc.desktop.isInDebugMode = function(){
            if (!gc.desktop.isDesktop()) return false;
            if (!gc.desktop.isDebugModeSupported()) return false;
            var result = false;
            var gui = require('nw.gui');
            if (gui.App.manifest.window.toolbar) {
                result = true;
            }
            return result;
        };
        gc.desktop.getDefaultWindowOptions = function (titleArg, widthArg, heightArg) {
            if (!gc.desktop.isDesktop()) return null;
            var gui = require('nw.gui');
            var nwVerId = _getNodeWebkitVersionId();
            var strTitle = titleArg;
            if (!strTitle) {
                strTitle = gui.App.manifest.splash_title;
            }
            var width = widthArg;
            if ((width === null)||(width === undefined)) {
                width = gui.App.manifest.main_width;
            }
            var height = heightArg;
            if ((height === null)||(height === undefined)) {
                height = gui.App.manifest.main_height;
            }

            var result = {
                title: strTitle,
                show: true,
                frame: true,
                position: 'center',
                width: width,
                height: height,
                focus: true,
                icon: "gui_icon.png"
            };
            if (nwVerId <= 12) {
                result.toolbar = gui.App.manifest.window.toolbar;
            }
            return result;
        };
        /**
         * gc.desktop.openWindow opens a node-webkit window
         *
         * @param urlArg - the URL to display in the window
         * @param optionsArg - the nodeWebkit options object, null for default values
         * @param moveByArg - for cascading windows set to 25 else leave null
         * @param callbackArg - the function to call back when window opens.  The window handle is passed as the only parameter.
         */
        gc.desktop.openWindow = function (urlArg, optionsArg, moveByArg, callbackArg) {
            var gui = require('nw.gui');
            var url = urlArg;
            console.log("gc.desktop.openWindow: url="+urlArg);


            var options = optionsArg;
            if (!options) {
                options = gc.desktop.getDefaultWindowOptions(gui.App.manifest.splash_title, gui.App.manifest.main_width, gui.App.manifest.main_height)
            }
            var newWinPolicyHandler = function (frame, urlArg, policy) {
                var policyOptions = options;
                policy.setNewWindowManifest(policyOptions);
            };
            var winHandle;
            var onOpenWindowCallback = function (winArg) {
                var win = winArg;
                if (!win) {
                    win = winHandle;
                }
                if (!win){
                    console.log("gc.Desktop.onOpenWindowCallback: winHandle not defined");
                }
                if ((win) && (win.on)) {
                    win.on('new-win-policy', newWinPolicyHandler);
                }
                if ((win) && (win.getNodeWebkitContext) && (win.opener)){
                    win.getNodeWebkit(win,win.opener);
                }
                if (callbackArg) {
                    callbackArg(win);
                }
                if (moveByArg) {
                    win.moveBy(moveByArg, moveByArg);
                }
            };
            var nwVerId = _getNodeWebkitVersionId();
            if (nwVerId <= 12) {
                winHandle = gui.Window.open(url, options);
                // In order to avoid getting an "Unable to get render view in GetWindowObject" exception,
                // wait for the window to be opened before trying to use the window object.
                // See https://github.com/edjafarov/node-webkit-desktop-notification/issues/2
                window.setTimeout(function(){
                    onOpenWindowCallback(winHandle);
                },50);
            } else {
                if (urlArg.indexOf('http') === -1) {
                    var path = require('path');
                    url = path.normalize(path.join(process.cwd(),urlArg));
                    console.log("gc.desktop.openWindow: normalized url=" + url);
                }
                gui.Window.open(url,options,onOpenWindowCallback);
            }

        };
        gc.desktop.setNodeWebkit = function(nwObj, windowHandle, getNodeWebkitFunc){
            gc.nw = {
                process: nwObj.process,
                nw: nwObj.nw,
                require: nwObj.require,
                nw_shell: nwObj.nw_shell,
                nw_window: nwObj.nw_window,
                opener: windowHandle
            };
            windowHandle.getNodeWebkit = getNodeWebkitFunc;
        };

        gc.desktop.openBrowserWindow = function(url) {
            var gui = require('nw.gui');
            gui.Shell.openExternal(url);
        };

        gc.desktop.closeWindow = function(win,quitApp){
            var gui = require('nw.gui');
            if (!win) {
                win = gui.Window.get();
            }
            if (win) {
                win.close(true);
            }
            if (quitApp) {
                if (gui) {
                    gui.App.quit();
                } else if (navigator.app) {
                    navigator.app.exitApp();
                } else if (navigator.device) {
                    navigator.device.exitApp();
                } else {
                    window.close();
                }
            }
        };
        gc.desktop.getPathToDesignerFolder = function(){
            var path = require('path');
            var splashDirPath = process.cwd();
            return path.join(splashDirPath,"..","..","designer");
        };
        gc.desktop.getPathToWorkspaceFolder = function(){
            var path = require('path');
            var nwDesignerFolderPath = gc.desktop.getPathToDesignerFolder();
            return path.join(nwDesignerFolderPath,"..",'workspace');
        };
        gc.desktop.isAppPreview = function(){
            var result = false;
            var url = document.baseURI;
            if (gc.desktop.isDesktop()){
                if (url.indexOf('/workspace/') > 0){
                    result = true;
                }
            } else {
                if (url.indexOf('/preview/') > 0){
                    result = true;
                }
            }
            return result;
        },
        gc.desktop.getPathToProjectFolder = function(pathRelativeToWorkspaceFolder){
            var nwWorkspaceFolderPath = gc.desktop.getPathToWorkspaceFolder();
            var relAppPath = pathRelativeToWorkspaceFolder;
            var serverPrefix = "/workspaceserver/gc/default/";
            if ((relAppPath) && (relAppPath.indexOf(serverPrefix) === 0)) {
                relAppPath = relAppPath.substring(serverPrefix.length);
            } else {
                relAppPath = "";
            }
            var path = require('path');
            return path.join(nwWorkspaceFolderPath,relAppPath);
        };
        gc.desktop.getPathToTargetFolder = function(){
            var path = require('path');
            var splashDirPath = process.cwd();
            return path.join(splashDirPath, '..','target');
        };
        gc.desktop.getPathToComponentsFolder = function(){
            var path = require('path');
            var nwDesignerFolderPath = gc.desktop.getPathToDesignerFolder();
            return path.join(nwDesignerFolderPath, 'components');
        };
        gc.desktop.openExplorer = function(folderPath) {
            var path = require('path');
            var exec = require('child_process').exec;
            var os = gc.desktop.getOS();
            var command = "";
            switch (os){
                case 'win':
                    command = 'explorer "' + path.normalize(folderPath) + '"';
                    break;
                case 'osx':
                    command = 'open "'+path.normalize(folderPath) + '"';
                    break;
                case 'linux':
                    command = 'nautilus --browser "'+path.normalize(folderPath) + '"';
                    break;
            }
            if (command.length > 0){
                try {
                    exec(command);
                }
                catch (ex){
                    console.log('gc.desktop.openExplorer: Exception while opening explorer: command = '+command+', ex=' + ex.toString());
                }
            }

        };
        gc.desktop.getOS = function(){
            var os  = 'linux';
            if (navigator.appVersion.indexOf("Mac") != -1) {
                os = 'osx';
            } else if (navigator.appVersion.indexOf("Win")!= -1) {
                os = 'win';
            }
            return os;
        };
        gc.desktop.getDesktopPathPrefix = function(){
            var result = "";
            if (gc.desktop.isDesktop()){
                // we use node.js readFileSync to read the file,
                // and the relative path has to be w.r.t. the location
                // of the package.json file used to start node-webkit,
                // which is either in the designer's splash folder, the
                // installed application's splash folder, or in the workspace
                // project's splash folder.  In the last case, there is no
                // components folder - we have to use the designer's component
                // folder instead.
                var workingDir = process.cwd();
                if (workingDir.indexOf("workspace") > 0){
                    // project is being previewed - use the designer's component folder
                    result = "../../../designer/";
                } else {
                    result = "../";
                }
            }

            return result;
        };
        gc.desktop.getPathToSupportedDevicesJson = function() {
            var jsonFilePath = gc.desktop.getDesktopPathPrefix()+"components/ti-core-backplane/supported_devices.json";
            return jsonFilePath;
        };
        gc.desktop.getPathToTargetSetupJson = function() {
            var jsonFilePath = gc.desktop.getDesktopPathPrefix()+"components/ti-core-backplane/target_setup.json";
            return jsonFilePath;
        };


        gc.desktop.fixPath = function(url){
            var src = url;
            if (gc.desktop.isDesktop()) {
                var path = require('path');
                if (src.indexOf('/designer') === 0) {
                    src = path.join(process.cwd(), '..', '..', url);
                }
                if (url.indexOf('/workspaceserver/gc/default') === 0) {
                    src = path.join(process.cwd(), '..', '..', 'workspace', url.substring('/workspaceserver/gc/default'.length));
                }
            }
            return src;
        };
        gc.desktop.existsSync = function(filePath) {
            var result = undefined;
            var src = gc.desktop.fixPath(filePath);
            if (gc.desktop.isDesktop()) {
                var fs = require('fs');
                try {
                    result = fs.existsSync(src);
                }
                catch(ex){
                    console.error("gc.desktop.existsSync exception: ex="+ex);
                }
            }
            return result;

        };
        gc.desktop.createDirectorySync = function(dirPath){
            if (gc.desktop.isDesktop()) {
                var fs = require('fs');
                var path = require('path');
                var ok = false;
                var dest = gc.desktop.fixPath(dirPath);
                var dirExists = gc.desktop.existsSync(dest);
                if (!dirExists) {
                    // making directory without exception if exists
                    try {
                        ok = true;
                        fs.mkdirSync(dest, 0755);
                    } catch (e) {
                        if (e.code != "EEXIST") {
                            ok = false;
                            console.log("gc.desktop.createDirectorySync(" + dirPath + ") failed making folder: ex=" + e);
                        }
                    }
                }
            }
            return ok;
        };
        gc.desktop.copyDirectoryContentsSync = function(relSrcPath, relDestPath){
            if (gc.desktop.isDesktop()){
                var fs = require('fs');
                var path = require('path');
                var ok = false;
                var src = gc.desktop.fixPath(relSrcPath);
                var dest = gc.desktop.fixPath(relDestPath);
                var dirExists = gc.desktop.existsSync(src);
                if (dirExists){
                    // making directory without exception if exists
                    try {
                        ok = true;
                        fs.mkdirSync(dest, 0755);
                    } catch(e) {
                        if(e.code != "EEXIST") {
                            ok = false;
                            console.log("gc.desktop.copyDirectoryContentsSync("+relSrcPath+","+relDestPath+") failed making destination folder: ex="+e);
                        }
                    }
                }
                if (ok) {
                    try {
                        var files = gc.desktop.readDirSync(src, false, null);
                        for (var i = 0; i < files.length; i++) {
                            var current = fs.lstatSync(path.join(src, files[i]));
                            if (current.isDirectory()) {
                                gc.desktop.copyDirectoryContentsSync(path.join(src, files[i]), path.join(dest, files[i]));
                            } else if (current.isSymbolicLink()) {
                                var symlink = fs.readlinkSync(path.join(src, files[i]));
                                fs.symlinkSync(symlink, path.join(dest, files[i]));
                            } else {
                                var fileContents = gc.desktop.readFileSync(path.join(src, files[i]));
                                gc.desktop.writeFileSync(path.join(dest, files[i]), fileContents);
                            }
                        }
                    } catch(ex){
                        console.log("gc.desktop.copyDirectoryContentsSync("+relSrcPath+","+relDestPath+") exception: ex="+ex);
                        ok = false;
                    }
                } else {
                    console.log("gc.desktop.copyDirectoryContentsSync("+relSrcPath+","+relDestPath+") failed: dirExists="+dirExists+", ok="+ok);
                }
            }
            return (ok);
        };
        gc.desktop.readDirSync = function(filePath,ifExists, filter){
            var result = [];
            if (gc.desktop.isDesktop()){
                var fs = require('fs');
                var dirExists = true;
                var url = gc.desktop.fixPath(filePath);
                if (ifExists){
                    dirExists = gc.desktop.existsSync(url);
                }
                try {
                    var list = undefined;
                    if (dirExists) {
                        list = fs.readdirSync(url);
                    }
                    if ((filter) && (filter.length > 0) && (list) && (list.length > 0)){
                        for (var i=0; i < list.length; i++){
                            if (list[i].indexOf(filter) >= 0){
                                result.push(list[i]);
                            }
                        }
                    } else {
                        result = list;
                    }
                }
                catch(ex){
                    console.error("gc.desktop.readDirSync exception: ex="+ex);
                }

            }
            return result;
        };
        gc.desktop.readFileSync = function(filePath)  {
            var result = null;
			if (gc.desktop.isCCS()) {
				var xhttp = new XMLHttpRequest();
				xhttp.onreadystatechange = function() {
					if (this.readyState == 4 && this.status == 200) {
						result = xhttp.responseText;
					}
				};
				xhttp.open("GET", window.location.toString() + filePath, false);
				xhttp.send();
				
				
				return result;
			} else {
				if (gc.desktop.isDesktop()) {
                    var fs = require('fs');
                    var src = gc.desktop.fixPath(filePath);
                    try {
                        result = fs.readFileSync(src, 'utf8');
                    }
                    catch (ex) {
                        console.log("gc.desktop.readFileSync(" + filePath + ") failed - ex=" + ex);
                    }
                }
                return result;
			}
        };
        gc.desktop.writeFileSync = function(filePath, contents)  {
            var result = null;
                if (gc.desktop.isDesktop()) {
                    var fs = require('fs');
                    var src = gc.desktop.fixPath(filePath);
                    try {
                        result = fs.writeFileSync(src, contents);
                    }
                    catch (ex) {
                        console.log("gc.desktop.writeFileSync(" + filePath + ") failed - ex=" + ex);
                        result = ex;
                    }
                }
                return result;
        };
        gc.desktop.copyFileSync = function(srcFilePath,destDirPath) {
            var result = true;
            if (gc.desktop.isDesktop()) {
                var fs = require('fs');
                var path = require('path');
                var src = gc.desktop.fixPath(srcFilePath);
                var destDir = gc.desktop.fixPath(destDirPath);
                var dirExists = gc.desktop.existsSync(destDir);
                if (!dirExists){
                    // making directory without exception if exists
                    try {
                        fs.mkdirSync(destDir, 0755);
                    } catch(e) {
                        if(e.code != "EEXIST") {
                            result = false;
                            console.log("gc.desktop.copyFileSync("+srcFilePath+","+destDirPath+") failed making destination folder: ex="+e);
                        }
                    }
                }
                if (result) {
                    var fileName = path.basename(src);
                    var dest = path.join(destDir, fileName);
                    try {
                        var fileContents = gc.desktop.readFileSync(src);
                        gc.desktop.writeFileSync(dest, fileContents);
                    }
                    catch (ex) {
                        result = false;
                        console.log("gc.desktop.writeFileSync(" + filePath + ") failed - ex=" + ex);
                    }
                }
            }
            return result;
        }

    }());
}
