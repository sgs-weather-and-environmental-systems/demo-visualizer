var serveStatic = require("serve-static");
var http = require("http");

function endError(res, message) {
    res.writeHead(404, {"content-type": "text/html"});
    res.end(message);
}

var serve = serveStatic('..', {index: ['index.html', 'index.htm']});
var AppServer = function() {};
AppServer.prototype.started = false;
AppServer.prototype.start = function(callback) {
	if(!this.started) {
		this.started = true;
		var server = http.createServer(function(req, res) {
			serve(req, res, function(err) {
				endError(res, "Resource Not Found: " + req.url);
			});
		});
		
		var onListening = function() {
			server.removeListener("listening", onListening);
			callback(server);
		};
		
		server.once("listening", onListening);
		server.listen(0);
	}
};

var appServer = new AppServer();
module.exports = appServer;