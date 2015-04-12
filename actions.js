function createAddLabelAction(imap, label) {
  return function addLabelAction(msg) {
    var uid = msg.attrs.uid;
    var gmailId = msg.attrs['x-gm-msgid'];

    return imap.addLabels(uid, label).then(function() {
      console.log('  Label ' + label + ' added');
    }, function(err) {
      console.error(gmailId, uid, msg.headers.subject[0]);
      console.error('  Failed to add label ' + label, err);
      throw err;
    });
  };
}

function createRemoveLabelAction(imap, label) {
  return function removeLabelAction(msg) {
    var uid = msg.attrs.uid;
    var gmailId = msg.attrs['x-gm-msgid'];

    return imap.delLabels(uid, label).then(function() {
      console.log('  Label ' + label + ' removed');
    }, function(err) {
      console.error(gmailId, uid, msg.headers.subject[0]);
      console.error('  Failed to remove label ' + label, err);
      throw err;
    });
  };
}

function createMoveAction(imap, box) {
  return function moveAction(msg) {
    var uid = msg.attrs.uid;
    var gmailId = msg.attrs['x-gm-msgid'];

    return imap.move(uid, box).then(function() {
      console.log('  Moved to ' + box);
    }, function(err) {
      console.error(gmailId, uid, msg.headers.subject[0]);
      console.error('  Failed to move to ' + box, err);
    });
  };
}

exports.addLabel = createAddLabelAction;
exports.removeLabel = createRemoveLabelAction;
exports.move = createMoveAction;

