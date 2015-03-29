function createAddLabelAction(imap, label) {
  return function addLabelAction(msg) {
    var uid = msg.attrs.uid;
    var gmailId = msg.attrs['x-gm-msgid'];

    imap.addLabels(uid, label, function(err) {
      if (err) {
        console.error(gmailId || uid, 'Failed to add label ' + label, err);
      } else {
        console.log(gmailId || uid, 'Label ' + label + ' added');
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
        console.error(gmailId || uid, 'Failed to remove label ' + label, err);
      } else {
        console.log(gmailId || uid, 'Label ' + label + ' removed');
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
        console.error(gmailId || uid, 'Failed to move to ' + box, err);
      } else {
        console.log(gmailId || uid, 'Moved to ' + box);
      }
    });
  };
}

exports.addLabel = createAddLabelAction;
exports.removeLabel = createRemoveLabelAction;
exports.move = createMoveAction;

