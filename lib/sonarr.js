var restify = require('restify-clients');
var assert = require('assert-plus');
var VError = require('verror');

function SonarrClient(sonarrApiURL, sonarrApiKey) {
  assert.string(sonarrApiURL, 'Sonarr URL');
  assert.string(sonarrApiKey, 'Sonarr API Key');
  this.sc = restify.createJsonClient({
      url: sonarrApiURL,
      headers: {'X-Api-Key' : sonarrApiKey},
      version: '*',
      connectTimeout: 2000,
      requestTimeout: 10000
    });
}

SonarrClient.prototype.getCalendar = function(cb) {
  assert.func(cb, 'Callback');
  var self = this;
  self.sc.get('/api/calendar', function getCalendarCb(err, req, res, obj) {
    if(err) {
      var verr = new VError({
        'name': 'CalendarFetchError',
        'cause': err
      }, 'failed to retrieve calendar from sonarr'); 
      return cb(verr, null);
    }
    cb(null, obj);
  });
}

module.exports = SonarrClient;
