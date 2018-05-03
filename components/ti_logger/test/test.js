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

var assert = require("assert");
var tiutil = require("ti_util");
var fs = require("fs");

var userTempDirectory = getTempDirectory();

var logFilename = "testlog_" + (new Date()).getTime() + ".log";
var find = /\\/g;
var re = new RegExp(find);

userTempDirectory = userTempDirectory.replace(re, '/');
var logFileAbsolute = userTempDirectory + "/" + logFilename;
console.log("log File name=" + logFileAbsolute);
var localLogCopyFile = "./test/testlog_abcde12345.log";


/* ===============================================
 * getTempDirectory
 * =============================================== */
var tempDirectory;
function getTempDirectory()
{	
	if(!tempDirectory)
	{
		tempDirectory = process.env.TMPDIR || 
						process.env.TMP || 
						process.env.TEMP ||
						(process.platform === 'win32' ? 'c:\\windows\\temp' : '/tmp');
	}

	return tempDirectory;
}


/* ===============================================
 * readLogFile
 * =============================================== */
function geFileLineCount(file)
{
	//console.log("geFileLineCount called");
	var lineCount=0;
	try
	{
		var content = fs.readFileSync(file);

		for (var i = 0; i < content.length; i++)
		{
			if (content[i] == 10) lineCount++;
		}
	}
	catch(err)
	{
		console.log(err.message);
	}
	
	return lineCount;
}

/* ===============================================
 * fillLog
 * =============================================== */
 var myConfig = 
{
	"fileLogger":
	{
		"logDirectory":userTempDirectory,
		"logFilename":logFilename,
		"json": false,
		"timestamp":false,
		"maxRollingFiles": 1,	
		"maxFileSize": 3145728,
		"levels": 
		{
			"defaultLevel": "tracefinest"
		}
	},
	"consoleLogger":
	{
		"levels": 
		{
			"defaultLevel": "off"
		}
	}
};

function fillLog()
{
	logger.error("my error messsage");
	logger.warn("my warning messsage");
	logger.info("my info messsage");
	logger.trace("my trace messsage");
	logger.tracefiner("my tracefiner messsage");
	logger.tracefinest("my tracefinest messsage");
	logger.error("source1","my error messsage");
	logger.warn("source1","my warning messsage");
	logger.info("source1","my info messsage");
	logger.trace("source1","my trace messsage");
	logger.tracefiner("source1","my tracefiner messsage");
	logger.tracefinest("source1","my tracefinest messsage");
	
	myConfig.fileLogger.json=true;
	myConfig.fileLogger.levels.defaultLevel="info";
	logger.setConfiguration(myConfig);
	
	
	logger.error("my error messsage");
	logger.warn("my warning messsage");
	logger.info("my info messsage");
	logger.trace("my trace messsage");
	logger.tracefiner("my tracefiner messsage");
	logger.tracefinest("my tracefinest messsage");
	logger.error("source1","my error messsage");
	logger.warn("source1","my warning messsage");
	logger.info("source1","my info messsage");
	logger.trace("source1","my trace messsage");
	logger.tracefiner("source1","my tracefiner messsage");
	logger.tracefinest("source1","my tracefinest messsage");
}	

/* ===============================================
 * isFileContentIdentical
 * =============================================== */

function isFileContentIdentical(file1,file2)
{
	var content1=fs.readFileSync(file1, "utf8").replace(/(\r\n|\n|\r)/gm,"");
	var content2= fs.readFileSync(file2, "utf8").replace(/(\r\n|\n|\r)/gm,"");	
	//console.log("compareFileContents called");
	var isSame = (content1 == content2);
	//if(!isSame)
	{
		var contents = "isSame=" + isSame + 
			"\nlog File---------------------" + file1 +"\n"+content1 +
			"\nGolden File---------------------" + file2 + "\n"+content2;
		fs.writeFileSync(localLogCopyFile,contents, "utf8");
	}
	return isSame
}

//------------------------------------------------------
var logger = require('../lib/ti_logger.js')(myConfig);
fs.openSync(logFileAbsolute,'w'); //ensure file is created and empty
fs.openSync(localLogCopyFile,'w'); // logCopy
var winstonLogger = logger.__getWinstonLogger();
var messageLoggedCount=0;


winstonLogger.on('logging', function (transport, level, msg, meta) 
{
	messageLoggedCount++;
	if(messageLoggedCount==goldenFileLineCount)
	{
		console.log("FULL messageLoggedCount="+messageLoggedCount);
	}	
});

fillLog();

var goldenFile = "./test/golden1.data";
var goldenFileLineCount = geFileLineCount(goldenFile);

//------Test Start here-------------------------------
//------------------------------------------------------
describe('ti_logger.require', function()
{
	it('logger should be a real object', function()
	{
	   assert.notEqual(logger,undefined);
	   assert.notEqual(logger,null);
	   assert(tiutil.isObject(logger));
	   assert(tiutil.isRealObject(logger));
	})
})



describe('ti_logger.ti_logger function Test', function()
{
	//fs.openSync(logFileAbsolute,'w');
	describe('#error must be a function of logger', function()
	{
		it('ensure that the function error exist', function()
		{
			assert( logger['error']); 
			assert(tiutil.isFunction(logger.error)); 
		})
	})

	describe('#warn must be a function of logger', function()
	{
		it('ensure that the function warn exist', function()
		{
			assert( logger['warn']); 
			assert(tiutil.isFunction(logger.warn)); 
		})
	})

	describe('#info must be a function of logger', function()
	{
		it('ensure that the function info exist', function()
		{
			assert( logger['info']); 
			assert(tiutil.isFunction(logger.info)); 
		})
	})

	describe('#trace must be a function of logger', function()
	{
		it('ensure that the function trace exist', function()
		{
			assert( logger['trace']); 
			assert(tiutil.isFunction(logger.trace)); 
		})
	})

	describe('#tracefiner must be a function of logger', function()
	{
		it('ensure that the function tracefiner exist', function()
		{
			assert( logger['tracefiner']); 
			assert(tiutil.isFunction(logger.tracefiner)); 
		})
	})

	describe('#tracefinest must be a function of logger', function()
	{
		it('ensure that the function tracefinest exist', function()
		{
			assert( logger['tracefinest']); 
			assert(tiutil.isFunction(logger.tracefinest)); 
		})
	})

	describe('#setConfiguration must be a function of logger', function()
	{
		it('ensure that the function setConfiguration exist', function()
		{
			assert( logger['setConfiguration']); 
			assert(tiutil.isFunction(logger.setConfiguration)); 
		})
	})
}) 

var stack1=(new Error()).captureStackTrace();
console.log(stack1);
describe ('ti_logger.log file content', function()
{
	beforeEach(function(done)
	{
		setTimeout(function()
		{
			done();
		},1700);
	});

	it('Ensure that log file content is correct', function()
	{
		assert(isFileContentIdentical(logFileAbsolute,goldenFile));
	})
});


  
