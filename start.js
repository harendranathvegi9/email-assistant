#!/usr/bin/env node

var spawn = require('child_process').spawn;
var prompt = require('prompt');
var fs = require('fs');
var logStream = fs.createWriteStream('./log', {flags: 'a'});


prompt.message = '';
prompt.delimiter = '';
prompt.start();

prompt.get({
  properties: {
    username: {
      required: true
    },
    password: {
      required: true,
      hidden: true
    }
  }
}, function (err, result) {
  spawn(process.execPath, ['./fetch.js'], {
    env: {
      X_USERNAME: result.username,
      X_PASSWORD: result.password
    },
    stdio: [
      'ignore', logStream, logStream
    ],
    detached: true
  }).unref();
});
