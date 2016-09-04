var bunyan = require('bunyan');
var restify = require('restify');

var app = require('./lib').app
var config = require('./config');

function run() {
  LOG = bunyan.createLogger({
    level: ('info'),
    name: config.server.name,
    stream: process.stdout,
    serializers: restify.bunyan.serializers
});

  return app.createServer(config.server, function (server) {
    server.start(function () {
      LOG.info('server listening at %s', server.url);
    });

    return server;
  });
}

run();
