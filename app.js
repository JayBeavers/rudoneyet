var express = require('express');
var logger = require('morgan');

var app = express();
app.use(logger('dev'));

app.use(express.static('public'));

/// catch 404 and forward to error handler
app.use( (req, res, next) => {
  var err = new Error('Not Found: ' + req.url);
  err.status = 404;
  next(err);
});

/// error handlers
app.use( (err, req, res, next) => {
  res.writeHead(err.status || 500);
  res.end();
});

module.exports = app;
