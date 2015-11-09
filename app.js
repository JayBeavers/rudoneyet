import home from './routes/home.js';
import oauth from './routes/oauth.js';

var express = require('express');
var logger = require('morgan');
var util = require('util');

var app = express();
app.use(logger('dev'));

// Set the session cookies to expire in three years
var hour = 3600000;
var maxAge = 3 * 365 * 24 * hour;

var session = require('cookie-session');
app.use(session({ secret: 'yoyotrumble', maxAge: maxAge }));

app.use(express.static('public'));

var hbs = require('hbs');
var hbsutils = require('hbs-utils')(hbs);
hbsutils.registerWatchedPartials(__dirname + '/views/partials');
var helpers = require('hbs-helpers');
for (var helper in helpers) {
  hbs.registerHelper(helper, helpers[helper]);
}

app.set('view engine', 'hbs');

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
