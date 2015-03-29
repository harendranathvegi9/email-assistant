var Imap = require('imap');

var conditions = require('./conditions');
var actions = require('./actions');

var credentials = require('./credentials');
var ME = credentials.username || process.env.X_USERNAME;
var imap = new Imap({
  user: ME,
  password: credentials.password || process.env.X_PASSWORD,
  host: 'imap.gmail.com',
  port: 993,
  tls: true
});


// Gmail notes:
// - removing a label that the message was fetched through, eg. @ToBeProcessed,
//   can't be done with imap.delLabels, the message needs to be actually moved.
//
// - you can't label a message after moving to a different box
//
// - a message never gets removed from All Mail box

function processMessage(msg) {
  var uid = msg.attrs.uid;
  var gmailId = msg.attrs['x-gm-msgid'];

  console.log(gmailId, uid, msg.headers.subject[0]);

  // TODO: make this declarative

  //console.log('');
  //console.log('msg', JSON.stringify(msg, null, '  '));

  var meInTo = conditions.isInTo(ME);
  var hasAnyLabel = conditions.hasGmailLabel();
  var hasGmailImportantLabel = conditions.hasGmailLabel('\\Important');
  var isMomSpam = conditions.isMomSpam();

  var moveToInbox = actions.move(imap, 'INBOX');
  var moveToLowPriority = actions.move(imap, '@LowPriority');
  var moveToArchive = actions.move(imap, '[Gmail]/All Mail');
  var markTriaged = actions.removeLabel(imap, '@ToBeTriaged');
  var labelMom = actions.addLabel(imap, '@MomSpamAuto');

  markTriaged(msg);

  if (isMomSpam(msg)) {
    labelMom(msg);
    return moveToLowPriority(msg);
  }

  if (meInTo(msg) && hasGmailImportantLabel(msg)) {
    return moveToInbox(msg);
  }

  // TODO: if a message from me, in this thread, before this msg -> INBOX

  if (hasAnyLabel(msg)) {
    return;
    return moveToArchive(msg);
  }

  return moveToLowPriority(msg);
}

function fetchMessages(criterions, cb) {
  imap.search(criterions, function(err, results) {
    if (err) {
      return cb(err, []);
    }

    if (results.length === 0) {
      return cb(null, []);
    }

    console.log('Fetching ' + results.length + ' messages');

    var messages = [];
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
        messages.push({headers: headers, attrs: attrs});
      });
    });

    f.once('error', function(err) {
      console.error('Fetch error: ' + err);
      return cb(err, []);
    });

    f.once('end', function() {
      return cb(null, messages);
    });
  });
}


function checkNewMessages() {
  fetchMessages([['X-GM-LABELS', '@ToBeTriaged']], function(err, results) {
    if (err) {
      console.error('Error while searching/fetching new messages', err);
      return;
    }

    if (results.length === 0) {
      console.log('No new messages.');
      return;
    }

    console.log(results.length, 'New messages.');
    results.forEach(function(message) {
      var gmailThreadId = message.attrs['x-gm-thrid'];
      fetchMessages([['X-GM-THRID', gmailThreadId]], function(err, messagesInThread) {
        if (err) {
          console.error('Failed to fetch messages in thread', gmailThreadId, err);
        }

        return processMessage({headers: message.headers, attrs: message.attrs, thread: messagesInThread});
      });
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

  imap.openBox('[Gmail]/All Mail', false, function(err, box) {
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
