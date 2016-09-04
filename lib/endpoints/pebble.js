var restify = require('restify'); 
var VError = require('verror');

function mount(server, config) {
  var userdb = config.userdb;

  function register(req, res, next) {
    var pebbleToken = req.params.userToken;
    if ( req.headers.psecret !== config.psecret) {
      log.info('Invalid auth on registration');
      return next(new restify.NotAuthorizedError());
    }
    userdb.get(pebbleToken, function lookupUser(err, doc) {
      if (err) {
        log.trace('user not found in pouchdb');
        userdb.put({_id: pebbleToken}, function dbcreateuser(err2, doc) {
          if (err2) {
            var verr = new VError({
              'name': 'FailedUserCreate',
              'cause': err
            }, 'failed to create user in db');
            log.error('User create failed', verr);
            return next(new restify.InternalServerError());
          } 
          log.info('user created with token', pebbleToken);
          res.send("Success");
          return next();
        });
      } else {
        //We already found the user so report the conflict
        log.info('pebble token already in use', pebbleToken);
        return next(new restify.ConflictError());
      }
    });
  }

  server.get('/register/:userToken', register);
}

module.exports = {
  mount: mount
};
