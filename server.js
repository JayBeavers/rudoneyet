#!/usr/bin/env node
'use strict';

require('babel-core/register');

var debugService = require('debug');
debugService.enable('server');
debugService.enable('app');
debugService.enable('home');
debugService.enable('oauth');

var debug = require('debug')('server');

var app = require('./app');
app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), () => {
    debug('Express server listening on port ' + server.address().port);
});
