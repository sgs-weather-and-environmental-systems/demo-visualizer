/*******************************************************************************
 * Copyright (c) ${year} Texas Instruments Incorporated - http://www.ti.com/
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     Texas Instruments Incorporated - initial API and implementation
 *
 * Original Author:
 *     Boualem, Texas Instruments, Inc.
 *
 * Contributing Authors:
 *******************************************************************************/
var __DEBUG_MODE = false;
var ti_logger;

/* ===============================================
 * getISOTimestamp
 * =============================================== */
function getISOTimestamp() {
    return new Date().toISOString();
}

/* ===============================================
 * consoleDebug
 * =============================================== */
function consoleDebug(message) {
    if (__DEBUG_MODE) {
        console.log(message);
    }
}

var browserMode = true;

try {
    if (require && module) {
        browserMode = false;
    }
} catch (e) {}

consoleDebug("browserMode=" + browserMode);

if (browserMode) {
    consoleDebug("-------browser mode");
    var consoleDefaultLevel = 'warn';
    var consoleLevels = {};
    var consoleJson = false;
    var consoleLoggerTimestamp = false;
    var log2MemoryFlag = false;
    var memoryBasedLog = [];
    var MAX_ENTRIES_MEMORY_LOG = 100;

    var UNKNOWN_SOURCE = 'unknown-source';


    /* ===============================================
     * consoleLog2
     * =============================================== */
    function consoleLog2(level, source, message) {
        var sourceLevel;

        if (source in consoleLevels) {
            sourceLevel = consoleLevels[source];
        } else {
            sourceLevel = consoleDefaultLevel;
        }

        if (consoleJson) {
            if (consoleLoggerTimestamp) {
                console.log('{"source":"' + source + '","level":"' + level +
                    '","message":"' + message + '","timestamp":"' + getISOTimestamp() + '"}');
            } else {
                console.log('{"source":"' + source + '","level":"' + level + '","message":"' +
                    message + '"}');
            }
        } else {
            if (consoleLoggerTimestamp) {
                console.log(source + ":" + level + " - " + message + " - " + getISOTimestamp());
            } else {
                console.log(source + ":" + level + " - " + message);
                if (log2MemoryFlag) {
                    var memoryLogEntry = {
                        source: source,
                        level: level,
                        message: message
                    }
                    memoryBasedLog.push(memoryLogEntry);
                    if (memoryBasedLog.length > MAX_ENTRIES_MEMORY_LOG) {
                        memoryBasedLog.shift();
                    }
                }

            }
        }
    }

    /* ===============================================
     * __log2
     * =============================================== */
    function __log2(level, arg1, arg2) {
        var sourceLevel;

        if (!level || !arg1) {
            return;
        }

        if (!arg2) // log(level, message)
        {
            consoleLog2(level, UNKNOWN_SOURCE, arg1);
        } else // log(level, source, message)
        {
            consoleLog2(level, arg1, arg2);
        }

    }

    /* ======================================================================
     * browserOnlyLogger
     * ====================================================================== */
    var browserOnlyLogger = {
        error: function (arg1, arg2) {
            __log2('error', arg1, arg2);
        },

        warn: function (arg1, arg2) {
            __log2('warn', arg1, arg2);
        },
        info: function (arg1, arg2) {
            __log2('info', arg1, arg2);
        },

        trace: function (arg1, arg2) {
            __log2('trace', arg1, arg2);
        },

        tracefiner: function (arg1, arg2) {
            __log2('tracefiner', arg1, arg2);
        },

        tracefinest: function (arg1, arg2) {
            __log2('tracefinest', arg1, arg2);
        },

        setConfiguration: function (newConfiguration) {
            consoleDebug("---setConfiguration() newConfiguration:" + newConfiguration);
            //setConfiguration(newConfiguration, INVALID_SETCONFIGURATION_ARGUMENT);		
        },
        enableLog2Memory: function(flag) {
            if (flag === true || falg === false) {
                log2MemoryFlag = flag;
            }
        },
        getMemoryBasedLog: function () {
            return memoryBasedLog;
        },
        setLogMaxEntries: function(maxEntries) {
            if (maxEntries && !isNaN(parseFloat(maxEntries)) && isFinite(maxEntries)) {
                MAX_ENTRIES_MEMORY_LOG = maxEntries;
            }
        },

        //--- for testing-------------------
        __getWinstonLogger: function () {
            //return winstonLogger;
            return null;
        }
    }



    ti_logger = browserOnlyLogger;
} //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++=
else {
    var __DEBUG_MODE = false;

    var tiutil = require('ti_util');
    var util = require('util');
    var winston = require('winston');
    var fs = require('fs');
    var mkdirp = require('mkdirp');

    // Define the default values for the config parameters------
    var currentConfiguration;
    var fileLoggerDefaultLevel = 'warn';
    var fileLoggerLevels = {};
    var fileLoggerJson = true;
    var fileLoggerTimestamp = true;
    var maxRollingFiles = 5;
    var maxFileSize = 3145728;
    var handleUncaughtExceptions = true;

    var consoleDefaultLevel = 'warn';
    var consoleLevels = {};
    var consoleJson = false;
    var consoleLoggerTimestamp = false;

    var UNKNOWN_SOURCE = 'unknown-source';
    var UNKNOWN = 'unknown';
    var INVALID_REQUIRE_ARGUMENT = "The require('ti_logger') argument is not valid";
    var INVALID_SETCONFIGURATION_ARGUMENT = "The setConfiguration argument is not valid";

    var appName;
    var appDirectory;
    var logDirectory;
    var configFile;
    var mainLog;



    /* ===============================================
     * getDefaultAppDirectory
     * =============================================== */
    function getDefaultAppDirectory() {
        if (tiutil.isNodeWebkitApp()) {
            appName = tiutil.getAppName();
        } else {
            appName = 'node'; //FIXME
        }

        return tiutil.getConfigFileDir() + appName;
    }

    /* ===============================================
	  * internalConfigFileExists
	  - unused ( requirement change)
	  * =============================================== */
    function internalConfigFileExists() {
        var internalConfigFile = __dirname + "/log-config.json";

        if (fs.existsSync(internalConfigFile)) {
            consoleDebug(internalConfigFile + " exists");
            return true;
        } else {
            consoleDebug(internalConfigFile + " DOES NOT exists");
            return false;
        }
    }

    /* ===============================================
     * createDirectory
     * =============================================== */
    function createDirectory(directory) {
        if (!fs.existsSync(directory)) {
            mkdirp.sync(directory);
        }
    }

    /* ===============================================
     * readConfigurationFromFile
     * =============================================== */
    function readConfigurationFromFile() {
        try {
            //var currentConfiguration = JSON.parse(fs.readFileSync(configFile, 'utf8'));
            var content = fs.readFileSync(configFile, "utf8");
            currentConfiguration = JSON.parse(content);
        } catch (err) {
            var errorMessage = "Error parsing configuration file: " + err.message;
            consoleDebug(errorMessage);
            //throw new Error(errorMessage);
        }
    }

    /* ===============================================
     * setMainLog
     * =============================================== */
    function setMainLog() {
        if ('fileLogger' in currentConfiguration) {
            var fileLogger = currentConfiguration.fileLogger;

            if ('logDirectory' in fileLogger) {
                logDirectory = fileLogger.logDirectory;
                consoleDebug("logDirectory for logging is:  " + logDirectory);
            } else {
                appDirectory = getDefaultAppDirectory();
                logDirectory = appDirectory + "/logs";
            }

            // create logDirectory if it does not exist
            createDirectory(logDirectory);

            if ('logFilename' in fileLogger) {
                logFilename = fileLogger.logFilename;
                consoleDebug("logFilename is:  " + logFilename);

                mainLog = logDirectory + "/" + logFilename;
            } else {
                mainLog = logDirectory + "/mainLog.log";
            }
        }
    }

    /* ===============================================
     * setConfiguration
     * =============================================== */
    function setConfiguration(newConfiguration, invalidArgumentMessage) {
            var errorMessage;
            appDirectory = getDefaultAppDirectory();

            if (!newConfiguration) {
                // check if we have a valid config file under userHome/ti/appname
                var defaultConfigFile = appDirectory + "/log-config.json";
                //check if defaultConfigFile exists.
                if (fs.existsSync(defaultConfigFile)) {
                    configFile = defaultConfigFile;
                    consoleDebug(configFile + " exists");

                    readConfigurationFromFile();
                    setMainLog();
                    createWinstonLogger();
                    applyNewConfiguration();
                    watchLogFile();
                } else {
                    errorMessage = defaultConfigFile + " file does not exist";
                    consoleDebug(errorMessage);
                    throw new Error(errorMessage);
                }
            } else //check if configuration is valid
            {
                //if (typeof newConfiguration == 'string' || newConfiguration instanceof String)
                if (tiutil.isString(newConfiguration)) {
                    // we may be dealing with a configuration file path
                    consoleDebug("== configuration file=" + newConfiguration);
                    try {
                        if (fs.existsSync(newConfiguration)) {
                            configFile = newConfiguration;
                            consoleDebug(configFile + " exists");
                            readConfigurationFromFile();
                            setMainLog();
                            createWinstonLogger();
                            applyNewConfiguration();
                            watchLogFile();
                        } else {
                            errorMessage = newConfiguration + " file does not exist";
                            consoleDebug(errorMessage);
                            throw new Error(errorMessage);
                        }
                    } catch (err) {
                        consoleDebug(invalidArgumentMessage + " : " + err.message);
                        throw err;
                    }
                } else {
                    if (tiutil.isRealObject(newConfiguration)) {
                        currentConfiguration = newConfiguration;
                        consoleDebug("we have a configuration Object");
                        setMainLog();
                        createWinstonLogger();
                        applyNewConfiguration();
                    } else {
                        consoleDebug(invalidArgumentMessage);
                        throw new Error(invalidArgumentMessage);
                    }
                }
            }
        }
        /* ===============================================
         * applyNewConfiguration
         * =============================================== */
    function applyNewConfiguration() {
        if ('handleUncaughtExceptions' in currentConfiguration) {
            if (handleUncaughtExceptions != currentConfiguration.handleUncaughtExceptions) {
                handleUncaughtExceptions = currentConfiguration.handleUncaughtExceptions;
                consoleDebug("new setting for handleUncaughtExceptions  " + handleUncaughtExceptions);
                winstonLogger.exitOnError = handleUncaughtExceptions;
            }
        }

        if ('fileLogger' in currentConfiguration) {
            var fileLogger = currentConfiguration.fileLogger;

            //--------------json
            if ('json' in fileLogger) {
                if (fileLoggerJson != fileLogger.json) {
                    fileLoggerJson = fileLogger.json;
                    winstonLogger.transports['file.all'].json = fileLoggerJson;
                    consoleDebug("new setting for fileLogger json  " + fileLoggerJson);
                }
            }

            //
            if ('timestamp' in fileLogger) {
                if (fileLoggerTimestamp != fileLogger.timestamp) {
                    fileLoggerTimestamp = fileLogger.timestamp;
                    winstonLogger.transports['file.all'].timestamp = fileLoggerTimestamp;
                    consoleDebug("new setting for fileLogger timestamp  " + fileLoggerTimestamp);
                }
            }


            if ('maxRollingFiles' in fileLogger) {
                if (maxRollingFiles != fileLogger.maxRollingFiles) {
                    maxRollingFiles = fileLogger.maxRollingFiles;
                    winstonLogger.transports['file.all'].maxFiles = maxRollingFiles;
                    consoleDebug("new setting for maxRollingFiles " + maxRollingFiles);
                }
            }

            if ('maxFileSize' in fileLogger) {
                if (maxFileSize != fileLogger.maxFileSize) {
                    maxFileSize = fileLogger.maxFileSize;
                    winstonLogger.transports['file.all'].maxsize = maxFileSize;
                    consoleDebug("new maxFileSize " + maxFileSize);

                }
            }

            if ('levels' in fileLogger) {
                fileLoggerLevels = fileLogger.levels;

                if ('defaultLevel' in fileLoggerLevels) {
                    if (fileLoggerDefaultLevel != fileLoggerLevels.defaultLevel) {
                        fileLoggerDefaultLevel = fileLoggerLevels.defaultLevel;
                        //winstonLogger.transports['file.all'].level = fileLoggerDefaultLevel;
                        consoleDebug("new fileLoggerDefaultLevel " + fileLoggerDefaultLevel);
                    }
                } else {
                    fileLoggerDefaultLevel = 'warn';
                }
            } else {
                fileLoggerLevels = {};
                fileLoggerDefaultLevel = 'warn';
                //winstonLogger.transports['file.all'].level = fileLoggerDefaultLevel;
            }
        } else {
            fileLoggerDefaultLevel = 'warn';
            //winstonLogger.transports['file.all'].level = fileLoggerDefaultLevel;
            fileLoggerLevels = {};
            fileLoggerJson = true;
            winstonLogger.transports['file.all'].json = fileLoggerJson;
            maxRollingFiles = 5;
            winstonLogger.transports['file.all'].maxFiles = maxRollingFiles;
            maxFileSize = 3145728;
            winstonLogger.transports['file.all'].maxFileSize = maxFileSize;
        }

        // reading the configuration for the consoleLogger--------------
        if ('consoleLogger' in currentConfiguration) {
            var consoleLogger = currentConfiguration.consoleLogger;

            if ('json' in consoleLogger) {
                if (consoleJson != consoleLogger.json) {
                    consoleJson = consoleLogger.json;
                    consoleDebug("new console json " + consoleJson);
                }
            }

            if ('timestamp' in consoleLogger) {
                if (!consoleLoggerTimestamp || consoleLoggerTimestamp != consoleLogger.timestamp) {
                    consoleLoggerTimestamp = consoleLogger.timestamp;
                    consoleDebug("new setting for consoleLogger timestamp  " + consoleLoggerTimestamp);
                }
            }

            if ('levels' in consoleLogger) {
                consoleLevels = consoleLogger.levels;

                if ('defaultLevel' in consoleLevels) {
                    if (consoleDefaultLevel != consoleLevels.defaultLevel) {
                        consoleDefaultLevel = consoleLevels.defaultLevel;
                        consoleDebug("new consoleDefaultLevel " + consoleDefaultLevel);
                    }
                } else {
                    consoleDefaultLevel = 'warn';
                }

            } else {
                consoleDefaultLevel = 'warn';
                consoleLevels = {};
            }
        } else {
            consoleDefaultLevel = 'warn';
            consoleLevels = {};
            consoleJson = false;
        }
    }

    /* ===============================================
     * watchLogFile
     * =============================================== */
    function watchLogFile() {
        try {
            fs.watch(configFile, {
                persistent: true
            }, function (event, fileName) {
                consoleDebug("File Watch Event: " + event + " in " + fileName);
                readConfigurationFromFile();
                applyNewConfiguration();
            });
        } catch (err) {
            consoleDebug(err.message);
        }
    }


    /* ===============================================
     * createWinstonLogger
     * =============================================== */
    var winstonLogger;

    function createWinstonLogger() {
        if (!winstonLogger) {
            createNewWinstonLogger();
        }
    }

    /* ===============================================
     * createNewWinstonLogger
     * =============================================== */
    function createNewWinstonLogger() {
        winstonLogger = new(winston.Logger)
            ({
                levels: {
                    tracefinest: 1,
                    tracefiner: 2,
                    trace: 3,
                    info: 4,
                    warn: 5,
                    error: 6,
                    off: 7
                },
                transports: [
    //new (winston.transports.Console)({ level: 'trace', json: false, colorize: true, timestamp: true }),
    new(winston.transports.File)({
                        level: 'tracefinest',
                        filename: mainLog,
                        name: 'file.all',
                        handleExceptions: handleUncaughtExceptions,
                        json: fileLoggerJson,
                        humanReadableUnhandledException: true
                    })
   ]
            });

        winstonLogger.exitOnError = handleUncaughtExceptions;
    }


    /*
	winstonLogger.on('logging', function (transport, level, msg, meta) 
	{
		if(transport.name == 'file.all')
		{	
			if( consoleLogging && consoleLevel && winstonLogger.levels[consoleLevel] <= winstonLogger.levels[level])
			{
				console.log(level + " - " + msg);
			}
		}
	});
	*/

    /* ===============================================
     * createDefaultConfigFile
     * =============================================== */
    function createDefaultConfigFile(configFile) {
        //create a config file with the default settings-----
        var defaultConfigFileContent = {
            "fileLogger": {
                "json": true,
                "maxRollingFiles": 5,
                "timestamp": true,
                "maxFileSize": 3145728,
                "levels": {
                    "defaultLevel": "warn"
                }
            },
            "consoleLogger": {
                "json": false,
                "timestamp": true,
                "levels": {
                    "defaultLevel": "warn"
                }
            }
        };

        fs.writeFileSync(configFile, JSON.stringify(defaultConfigFileContent, null, 4), "utf8");
    }

    /* ===============================================
     * consoleLog
     * =============================================== */
    function consoleLog(level, source, message) {
        var sourceLevel;

        if (source in consoleLevels) {
            sourceLevel = consoleLevels[source];
        } else {
            sourceLevel = consoleDefaultLevel;
        }

        if (winstonLogger.levels[sourceLevel] <= winstonLogger.levels[level]) {
            if (consoleJson) {
                if (consoleLoggerTimestamp) {
                    console.log('{"source":"' + source + '","level":"' + level +
                        '","message":"' + message + '","timestamp":"' + getISOTimestamp() + '"}');
                } else {
                    console.log('{"source":"' + source + '","level":"' + level + '","message":"' +
                        message + '"}');
                }
            } else {
                if (consoleLoggerTimestamp) {
                    console.log(source + ":" + level + " - " + message + " - " + getISOTimestamp());
                } else {
                    console.log(source + ":" + level + " - " + message);
                }
            }
        }
    }

    /* ===============================================
     * __log
     * =============================================== */
    function __log(level, arg1, arg2) {
        var sourceLevel;

        if (!level || !arg1) {
            return;
        }

        if (!arg2) // log(level, message)
        {
            sourceLevel = fileLoggerDefaultLevel;

            if (winstonLogger.levels[sourceLevel] <= winstonLogger.levels[level]) {
                winstonLogger.log(level, arg1, {
                    source: UNKNOWN
                });
            }
            consoleLog(level, UNKNOWN_SOURCE, arg1);
        } else // log(level, source, message)
        {
            if (arg1 in fileLoggerLevels) {
                sourceLevel = fileLoggerLevels[arg1];
            } else {
                sourceLevel = fileLoggerDefaultLevel;
            }

            if (winstonLogger.levels[sourceLevel] <= winstonLogger.levels[level]) {
                winstonLogger.log(level, arg2, {
                    'source': arg1
                });
            }
            consoleLog(level, arg1, arg2);
        }

    }

    /* ======================================================================
     * TILogger
     * ====================================================================== */
    module.exports = TILogger;

    function TILogger(requireArg) {
        //console.log("---TILogger constructor=");
        if (TILogger._singletonInstance) {
            return TILogger._singletonInstance;
        }

        //----------------------------------------------
        consoleDebug("---requireArg:" + requireArg);
        setConfiguration(requireArg, INVALID_REQUIRE_ARGUMENT);

        var singletonLogger = {};
        TILogger._singletonInstance = singletonLogger;
        //-------------------------------------------------

        TILogger.error = singletonLogger.error = function (arg1, arg2) {
            __log('error', arg1, arg2);
        };

        TILogger.warn = singletonLogger.warn = function (arg1, arg2) {
            __log('warn', arg1, arg2);
        };

        TILogger.info = singletonLogger.info = function (arg1, arg2) {
            __log('info', arg1, arg2);
        };

        TILogger.trace = singletonLogger.trace = function (arg1, arg2) {
            __log('trace', arg1, arg2);
        };

        TILogger.tracefiner = singletonLogger.tracefiner = function (arg1, arg2) {
            __log('tracefiner', arg1, arg2);
        };

        TILogger.tracefinest = singletonLogger.tracefinest = function (arg1, arg2) {
            __log('tracefinest', arg1, arg2);
        };

        TILogger.setConfiguration = singletonLogger.setConfiguration = function (newConfiguration) {
            consoleDebug("---setConfiguration() newConfiguration:" + newConfiguration);
            setConfiguration(newConfiguration, INVALID_SETCONFIGURATION_ARGUMENT);
        };

        //--- for testing-------------------
        TILogger.__getWinstonLogger = singletonLogger.__getWinstonLogger = function () {
            return winstonLogger;
        };

        return singletonLogger;
    }
}