function mount(server) {
  function respond(req, res, next) {
    res.send('hello ' + req.params.name);
    LOG.info('Got request for: ', req.url);
    next();
  }
  server.get('/hello/:name', respond);
}

module.exports = {
  mount: mount
};
