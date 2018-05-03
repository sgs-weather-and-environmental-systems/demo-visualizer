
var myConfig = 
{
	"fileLogger":
	{
		"logDirectory":"c:/temp/myapp/logs",
		"logFilename":"myAppMainLog.log",
		"json": true,
		"timestamp":true,
		"maxRollingFiles": 5,	
		"maxFileSize": 3145728,
		"levels": 
		{
			"defaultLevel": "trace"
		}
	},
	"consoleLogger":
	{
		"json": false,
		"timestamp":false,
		"levels": 
		{
			"defaultLevel": "trace"
		}
	}
};

var logger = require("ti_logger")(myConfig);

logger.info("info message"); //source not included
logger.info('module1', "info message"); //source included);