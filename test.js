var SC = require('./lib/sonarr');
var config = require('./config');

var sc = new SC(config.sonarr.url, config.sonarr.apikey);

sc.getCalendar(function calendarcb(err, episodes) {
  if (err) return console.log(err);
  console.log(episodes);
});
