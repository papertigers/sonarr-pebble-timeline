var bunyan = require('bunyan');
var restify = require('restify');
var PouchDB = require('pouchdb');

var app = require('./lib').app
var config = require('./config');
var userdb = new PouchDB('users');
config.server.userdb = userdb;

function run() {

  log = bunyan.createLogger({
    level: ('info'),
    name: config.server.name,
    stream: process.stdout,
    serializers: restify.bunyan.serializers
  });

  return app.createServer(config.server, function (server) {
    server.start(function () {
      log.info('server listening at %s', server.url);
    });

    return server;
  });
}

run();
