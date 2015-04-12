var q = require('q');

var ImapQ = require('./imap_q');
var conditions = require('./conditions');
var actions = require('./actions');

var credentials = require('./credentials');
var ME = credentials.username || process.env.X_USERNAME;
var imap = new ImapQ({
  user: ME,
  password: credentials.password || process.env.X_PASSWORD,
  host: 'imap.gmail.com',
  port: 993,
  tls: true
});

// Make debugging a bit easier.
q.longStackSupport = true;

function errorHandlerFor(label) {
  return function errorHandler(err) {
    console.error('error while', label, err);
    throw err;
  }
}


// Gmail notes:
// - removing a label that the message was fetched through, eg. @ToBeProcessed,
//   can't be done with imap.delLabels, the message needs to be actually moved.
//
// - you can't label a message after moving to a different box
//
// - a message never gets removed from All Mail box
var meInTo = conditions.isInTo(ME);
var hasAnyLabel = conditions.hasAnyCustomGmailLabels(['@ToBeTriaged']);
var hasGmailImportantLabel = conditions.hasGmailLabel('\\Important');
var isMomSpam = conditions.isMomSpam();
var earlierMessageFromMeInThread = conditions.earlierMessageInThreadFrom(ME);
var isSent = conditions.hasGmailLabel('\\Sent');

var moveToInbox = actions.move(imap, 'INBOX');
var moveToLowPriority = actions.move(imap, '@LowPriority');
var moveToArchive = actions.move(imap, '[Gmail]/All Mail');
var markTriaged = actions.removeLabel(imap, '@ToBeTriaged');
var labelMom = actions.addLabel(imap, '@MomSpamAuto');

function processMessage(msg) {
  var uid = msg.attrs.uid;
  var gmailId = msg.attrs['x-gm-msgid'];

  console.log(gmailId, uid, msg.headers.subject[0]);

  // TODO: make this declarative

  //console.log('');
  //console.log('msg', JSON.stringify(msg, null, '  '));

  if (isSent(msg)) {
    return markTriaged(msg);
  }

  if (earlierMessageFromMeInThread(msg)) {
    return q.all([markTriaged(msg), moveToInbox(msg)]);
  }

  if (meInTo(msg) && hasGmailImportantLabel(msg) && !hasAnyLabel(msg) && !isMomSpam(msg)) {
    return q.all([markTriaged(msg), moveToInbox(msg)]);
  }

  if (hasAnyLabel(msg)) {
    return markTriaged(msg);
  }

  return q.all([moveToLowPriority(msg), markTriaged(msg)]);
}

function fetchMessages(criterions) {
  return imap.search(criterions).then(function(results) {
    if (results.length === 0) {
      return [];
    }

    console.log('Fetching ' + results.length + ' messages');
    return imap.fetch(results, errorHandlerFor('fetching messages'));
  }, errorHandlerFor('searching'));
}


function checkNewMessages() {
  return fetchMessages([['X-GM-LABELS', '@ToBeTriaged']]).then(function(results) {
    if (results.length === 0) {
      console.log('No new messages.');
      return results;
    }

    console.log(results.length, 'New messages.');
    return q.all(results.map(function(message) {
      var gmailThreadId = message.attrs['x-gm-thrid'];
      return fetchMessages([['X-GM-THRID', gmailThreadId]]).then(function(messagesInThread) {
        return processMessage({headers: message.headers, attrs: message.attrs, thread: messagesInThread}).then(function(r) {
          return r;
        }, errorHandlerFor('processing message'));
      }, errorHandlerFor('fetching messages in thread ' + gmailThreadId));
    }));
  }, errorHandlerFor('fetching new messages'));
}


// Gmail boxes:
//  - All Mail
//  - Drafts
//  - Important
//  - Sent Mail
//  - Spam
//  - Starred
//  - Trash

var READ_ONLY = false;

imap.connect().then(function() {
  // console.log('Connected');

  imap.openBox('[Gmail]/All Mail', READ_ONLY)
    .then(checkNewMessages, errorHandlerFor('opening box'))
    .done(function() {
      // console.log('Done');
      imap.end();
    });
}, errorHandlerFor('connecting'));


process.on('SIGINT', function() {
  // Close the connection without waiting to finish pending requests.
  imap.destroy();
});
