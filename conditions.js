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

// TODO: special API hasAnyCustomLabel
var IGNORED_GMAIL_LABELS = ['\\Important', '\\Inbox', '\\Sent', '@ToBeTriaged'];
function createHasGmailLabel(label) {
  return label ? function hasGmailLabel(msg) {
    var labels = msg.attrs['x-gm-labels'];
    return labels.indexOf(label) !== -1;
  } : function hasAnyGmailLabel(msg) {
    var labels = msg.attrs['x-gm-labels'].filter(function(label) {
      return IGNORED_GMAIL_LABELS.indexOf(label) === -1;
    });
    return labels.length > 0;
  };
}

function isFirstInTheThread(msg) {
  var msgTime = Date.parse(msg.headers['date'][0]);

  return !msg['thread'].some(function(msgInThread) {
    return Date.parse(msgInThread.headers['date'][0]) < msgTime;
  });
}

var MOMSPAM_SUBJECT = /^(FWD|Fwd|FW|Fw):/;
function createIsMomSpam() {
  return function isMomSpam(msg) {
    return MOMSPAM_SUBJECT.test(msg.headers['subject']) && isFirstInTheThread(msg);
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
exports.isMomSpam = createIsMomSpam;
