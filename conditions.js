var EMAIL_REGEXP = /.*\<(.*)\>/;

function parseEmails(str) {
  return str.split(',').map(function(item) {
    var match = item.match(EMAIL_REGEXP);
    return match && match[1] || item;
  });
};

function createIsInTo(email) {
  return function isInTo(msg) {
    var to = parseEmails(msg.headers.to[0]);
    return to.indexOf(email) !== -1;
  };
}

function createIsTheOnlyOneInTo(email, ignoreCC) {
  return function isTheOnlyOneInTo(msg) {
    var to = parseEmails(msg.headers.to[0]);

    return to.length === 1 && to.indexOf(email) === 0;
  };
}

function createIsOnlyCC(email) {
  return function isOnlyCC(msg) {
    var to = parseEmails(msg.headers.to[0]);
    var cc = msg.headers.cc && parseEmails(msg.headers.cc[0]) || [];

    return to.indexOf(email) === -1 && cc.indexOf(email) !== -1;
  };
}

function createHasGmailLabel(label) {
  return function hasGmailLabel(msg) {
    var labels = msg.attrs['x-gm-labels'];
    return labels.indexOf(label) !== -1;
  };
}

var IGNORED_GMAIL_LABELS = ['\\Important', '\\Inbox', '\\Sent', '@ToBeTriaged'];
function createHasAnyCustomGmailLabels(ignoredLabels) {
  return function hasAnyCustomGmailLabels(msg) {
    var customLabels = msg.attrs['x-gm-labels'].filter(function(label) {
      return IGNORED_GMAIL_LABELS.indexOf(label) === -1 && ignoredLabels.indexOf(label) === -1;
    });

    return customLabels.length > 0;
  };
}


function filterEarlierMessagesInThread(msg) {
  if (!msg.thread) {
    return [];
  }

  var msgTime = Date.parse(msg.headers['date'][0]);

  return msg.thread.filter(function(msgInThread) {
    return Date.parse(msgInThread.headers['date'][0]) < msgTime;
  });
}

function isFirstInTheThread(msg) {
  return filterEarlierMessagesInThread(msg).length === 0;
}

var MOMSPAM_SUBJECT = /^(FWD|Fwd|FW|Fw):/;
function createIsMomSpam() {
  return function isMomSpam(msg) {
    return MOMSPAM_SUBJECT.test(msg.headers['subject']) && isFirstInTheThread(msg);
  };
}

function createEarlierMessageInThreadFrom(email) {
  return function earlierMessageInThreadFrom(msg) {
    return filterEarlierMessagesInThread(msg).some(function(msgInThread) {
      return parseEmails(msgInThread.headers['from'][0]).indexOf(email) !== -1;
    });
  };
}

// is from one of ...
// is important (gmail)
// thread you replied to

exports.parseEmails = parseEmails;
exports.isInTo = createIsInTo;
exports.isTheOnlyOne = createIsTheOnlyOneInTo;
exports.isOnlyCC = createIsOnlyCC;
exports.hasGmailLabel = createHasGmailLabel;
exports.hasAnyCustomGmailLabels = createHasAnyCustomGmailLabels;
exports.isMomSpam = createIsMomSpam;
exports.earlierMessageInThreadFrom = createEarlierMessageInThreadFrom;
