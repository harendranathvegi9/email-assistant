function createAddLabelAction(imap, label) {
  return function addLabelAction(msg) {
    var uid = msg.attrs.uid;
    var gmailId = msg.attrs['x-gm-msgid'];

    imap.addLabels(uid, label, function(err) {
      if (err) {
        console.error(gmailId, uid, msg.headers.subject[0]);
        console.error('  Failed to add label ' + label, err);
      } else {
        console.log('  Label ' + label + ' added');
      }
    });
  };
}

function createRemoveLabelAction(imap, label) {
  return function removeLabelAction(msg) {
    var uid = msg.attrs.uid;
    var gmailId = msg.attrs['x-gm-msgid'];

    imap.delLabels(uid, label, function(err) {
      if (err) {
        console.error(gmailId, uid, msg.headers.subject[0]);
        console.error('  Failed to remove label ' + label, err);
      } else {
        console.log('  Label ' + label + ' removed');
      }
    });
  };
}

function createMoveAction(imap, box) {
  return function moveAction(msg) {
    var uid = msg.attrs.uid;
    var gmailId = msg.attrs['x-gm-msgid'];

    imap.move(uid, box, function(err) {
      if (err) {
        console.error(gmailId, uid, msg.headers.subject[0]);
        console.error('  Failed to move to ' + box, err);
      } else {
        console.log('  Moved to ' + box);
      }
    });
  };
}

exports.addLabel = createAddLabelAction;
exports.removeLabel = createRemoveLabelAction;
exports.move = createMoveAction;

