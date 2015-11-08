import home from './routes/home.js';
import oauth from './routes/oauth.js';

var express = require('express');
var logger = require('morgan');
var util = require('util');

var app = express();
app.use(logger('dev'));

var hour = 3600000;
var maxAge = 21 * 24 * hour; // Set the cookie to expire in three weeks

var session = require('cookie-session');
app.use(session({ secret: 'yoyotrumble', maxAge: maxAge }));

app.use(express.static('public'));

app.use('/', home);
app.use('/', oauth);

/// catch 404 and forward to error handler
app.use( (req, res, next) => {
  var err = new Error('Not Found: ' + req.url);
  err.status = 404;
  next(err);
});

/// error handlers
app.use( (err, req, res, next) => {
  res.send(util.inspect(err));
});

module.exports = app;
