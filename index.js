var util = require('util');
var bunyan = require('bunyan');
var restify = require('restify');
var vasync = require('vasync');
var VError = require('verror');
var AsyncPolling = require('async-polling');
var PouchDB = require('pouchdb');
var Timeline = require('pebble-api').Timeline; 

var app = require('./lib').app
var config = require('./config');
var SC = require('./lib/sonarr');


var userdb = new PouchDB('users', {auto_compaction: true});
var userdb = new PouchDB('pins', {auto_compaction: true});
config.server.userdb = userdb;
var sc = new SC(config.sonarr.url, config.sonarr.apikey);
var timeline = new Timeline();

function run(cb) {

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

    return cb(server);
  });
}

function querySonarrCalendar(cb) {
  sc.getCalendar(function calendarcb(err, episodes) {
    if (err) {
      log.error('Error getting sonarr calendar', err);
      return cb(err, null);
    }
    log.trace('episodes', episodes);
    cb(null, episodes);
  });
}

function userProcess(cb) {
  //Check db for users and send them the most recent pins 
  userdb.allDocs({
    include_docs: true
  }, function(err, res) {
    if (err) {
      log.error('error talking to db', err);
      return cb(err, null);
    }
    //bail early if we have no registered users yet
    if (res.total_rows === 0) {
      log.trace('userdb has no users');
      return cb(null, null);
    }
    querySonarrCalendar(function(err, episodes) {
      //do something with episodes
    });
  });
}

function periodicSonarrQuery() {
  var polling = AsyncPolling(function (end) {
    userProcess(function() {
      end(null, null);
    });
  }, 300000);
  polling.run();
}

function buildPin(episode) {
  var pin = new Timeline.Pin({
    id: util.format('%s-%s-%s', episode.seriesId, episode.seasonNumber,
      episode.episodeNumber),
    time: new Date(episode.airDateUtc),
    layout: new Timeline.Pin.Layout({
    type: Timeline.Pin.LayoutType.GENERIC_PIN,
      tinyIcon: Timeline.Pin.Icon.TV_SHOW,
      title: episode.series.title,
      subtitle: episode.title,
      body: episode.overview
    })
  });
  return pin;
}

function sendPin(user, pin) {
  if (pin.date < Date.now()) return;
  timeline.sendUserPin(user, pin, function(err) {
    if (err) return log.error('failed to send timeline pin', err);
    log.info('pin sent', pin);
  });
}

function changeFeedInit() {
  var changes = userdb.changes({
    since: 'now',
    live: true,
    include_docs: true
  }).on('change', function handleDbChange(change) {
    querySonarrCalendar(function(err, episodes) {
      var pins = [];
      episodes.forEach(function(episode) {
        var pin = buildPin(episode); 
        pins.push(pin);
      });    
      pins.forEach(function(pin) {
        log.info(pin);
        //sendPin(change.id, pin);
      });
    }); 
  });
}

vasync.pipeline({
  funcs: [
    function setupServer(_, cb) {
      run(function(server) {
        cb(null, null);
      });
    },
    function setupPeriodicSonarrQuery(_, cb) {
      periodicSonarrQuery(); 
      cb(null, null);
    },
    function setupChangeFeed(_, cb) {
      changeFeedInit();
      cb(null, null);
    }
  ]
}, function (err, results) {
  //Things are running, nothing to do here
});
