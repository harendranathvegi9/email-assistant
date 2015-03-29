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

var IGNORED_GMAIL_LABELS = ['\\Important', '\\Inbox', '\\Sent'];
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


// is from one of ...
// is important (gmail)
// thread you replied to

exports.parseEmails = parseEmails;
exports.isInTo = createIsInTo;
exports.isTheOnlyOne = createIsTheOnlyOneInTo;
exports.isOnlyCC = createIsOnlyCC;
exports.hasGmailLabel = createHasGmailLabel;
