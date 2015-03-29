var Imap = require('imap');

var conditions = require('./conditions');
var actions = require('./actions');

var credentials = require('./credentials');
var ME = credentials.username;
var imap = new Imap({
  user: ME,
  password: credentials.password,
  host: 'imap.gmail.com',
  port: 993,
  tls: true
});


// Gmail notes:
// - removing a label that the message was fetched through, eg. @ToBeProcessed,
//   can't be done with imap.delLabels, the message needs to be actually moved.
//
// - you can't label a message after moving to a different box

function processMessage(msg) {
  // TODO: make this declarative

  //console.log('');
  //console.log('msg', JSON.stringify(msg, null, '  '));

  var meInTo = conditions.isInTo(ME);
  var hasAnyLabel = conditions.hasGmailLabel();
  var hasGmailImportantLabel = conditions.hasGmailLabel('\\Important');

  var moveToInbox = actions.move(imap, 'INBOX');
  var moveToLowPriority = actions.move(imap, '@LowPriority');
  var moveToArchive = actions.move(imap, '[Gmail]/All Mail');

  if (meInTo(msg) && hasGmailImportantLabel(msg)) {
    return moveToInbox(msg);
  }

  // TODO: if a message from me, in this thread, before this msg -> INBOX

  if (hasAnyLabel(msg)) {
    return moveToArchive(msg);
  }

  return moveToLowPriority(msg);
}


function checkNewMessages() {
  imap.search([['SINCE', 'March 20, 2015']], function(err, results) {
    if (err) {
      console.error('Error while searching box', err);
      throw err;
    }

    if (results.length === 0) {
      console.log('No new messages.');
      return;
    }

    console.log('Fetching ' + results.length + ' new messages');

    // to, sender, reply-to, list-unsubscribe, list-id, cc, bcc
    // TO, SENDER, REPLY-TO
    var f = imap.fetch(results, {
      bodies: 'HEADER.FIELDS (FROM TO CC BCC SUBJECT DATE)',
      struct: true
    });

    f.on('message', function(msg, seqno) {
      var headers = null;
      var attrs = null;

      msg.on('body', function(stream, info) {
        var buffer = '';
        stream.on('data', function(chunk) {
          buffer += chunk.toString('utf8');
        });
        stream.once('end', function() {
          headers = Imap.parseHeader(buffer);
        });
      });
      msg.once('attributes', function(_attrs) {
        attrs = _attrs;
      });
      msg.once('end', function() {
        processMessage({headers: headers, attrs: attrs});
      });
    });

    f.once('error', function(err) {
      console.error('Fetch error: ' + err);
    });

    f.once('end', function() {
      //console.log('Done fetching all messages!');
      //imap.end();
    });
  });
}

imap.once('ready', function() {
  /* Gmail boxes
[ 'All Mail',
  'Drafts',
  'Important',
  'Sent Mail',
  'Spam',
  'Starred',
  'Trash' ]
  */

  imap.openBox('@ToBeTriaged', false, function(err, box) {
    if (err) throw err;

    checkNewMessages();

    setInterval(checkNewMessages, 30000);
  });
});

imap.once('error', function(err) {
  console.error(err);
  process.exit(1);
});

imap.once('end', function() {
  console.log('Connection ended');
  process.exit();
});

imap.connect();

process.on('SIGINT', function() {
  imap.end();
});
