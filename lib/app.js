var restify = require('restify');
var pebbleEndpoint = require('./endpoints/pebble');

module.exports = {
  createServer: function (config, callback) {
    server = restify.createServer(config);
    server.use(restify.acceptParser(server.acceptable));
    server.use(restify.authorizationParser());
    server.use(restify.dateParser());
    server.use(restify.queryParser());
    server.use(restify.urlEncodedBodyParser());

    server.start = function start (cb) {
      return server.listen(config.port, config.host, cb);
    }

    pebbleEndpoint.mount(server, config);

    return callback(server);
  }
}
