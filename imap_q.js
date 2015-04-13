var Imap = require('imap');
var q = require('q');

// Promise-based wrapper around node-imap.
function ImapQ(options) {
  var _imap = new Imap(options);

  // Call imap.connect() and resolve the promise once the connection is ready.
  this.connect = function() {
    var deferred = q.defer();
    _imap.once('ready', function() {
      deferred.resolve();
    });
    _imap.once('error', function(err) {
      deferred.reject(err);
    });
    _imap.connect();
    return deferred.promise;
  };

  // Call imap.fetch() and resolve the promise with buffered messages.
  this.fetch = function(messageSource) {
    var deferred = q.defer();
    var messagesBuffer = [];

    var f = _imap.fetch(messageSource, {
      bodies: 'HEADER.FIELDS (FROM TO CC BCC SUBJECT DATE)',
      struct: true
    });

    f.on('message', function(msg, seqno) {
      var headers = null;
      var attrs = null;

      msg.on('body', function(stream, info) {
        var headersBuffer = '';
        stream.on('data', function(chunk) {
          headersBuffer += chunk.toString('utf8');
        });
        stream.once('end', function() {
          headers = Imap.parseHeader(headersBuffer);
        });
      });

      msg.once('attributes', function(_attrs) {
        attrs = _attrs;
      });

      msg.once('end', function() {
        messagesBuffer.push({headers: headers, attrs: attrs});
      });
    });

    f.once('error', function(err) {
      deferred.reject(err);
    });

    f.once('end', function() {
      deferred.resolve(messagesBuffer);
    });

    return deferred.promise;
  };

  // Call _imap.destroy() and resolve the promise once the connection is closed.
  this.destroy = function() {
    var deferred = q.defer();
    _imap.once('close', function() {
      deferred.resolve();
    });
    _imap.destroy();
    return deferred.promise;
  };

  // Call _imap.end() and resolve the promise once the connection is closed.
  this.end = function() {
    var deferred = q.defer();
    _imap.once('close', function() {
      deferred.resolve();
    });
    _imap.end();
    return deferred.promise;
  };

  // Promisify callbacks APIs.
  this.search = q.nbind(_imap.search, _imap);
  this.openBox = q.nbind(_imap.openBox, _imap);
  this.addLabels = q.nbind(_imap.addLabels, _imap);
  this.delLabels = q.nbind(_imap.delLabels, _imap);
  this.move = q.nbind(_imap.move, _imap);
}

module.exports = ImapQ;
