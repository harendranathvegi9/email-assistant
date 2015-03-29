var conditions = require('./conditions');

describe('conditions', function() {
  describe('parseEmails', function() {
    var parseEmails = conditions.parseEmails;

    it('should parse', function() {
      expect(parseEmails('Vojta Jina <vojta.jina@gmail.com>, Mike <soul@yahoo.com>')).toEqual(['vojta.jina@gmail.com', 'soul@yahoo.com']);
    });
  });

  describe('isInTo', function() {
    var vojtaIsInTo = conditions.isInTo('vojta.jina@gmail.com');

    it('should be true', function() {
      expect(vojtaIsInTo({
        "headers": {
          "to":["Me Vojta <vojta.jina@gmail.com>, Sir I. Newton <newton@gmail.com>"],
        }
      })).toBe(true);
    });

    it('should be false', function() {
      expect(vojtaIsInTo({
        "headers": {
          "to":["Sir I. Newton <newton@gmail.com>"],
        }
      })).toBe(false);
    });
  });

  describe('isTheOnlyOneInTo', function() {
    var vojtaIsTheOnlyOneInTo = conditions.isTheOnlyOne('vojta.jina@gmail.com');

    it('should be false if others in TO', function() {
      expect(vojtaIsTheOnlyOneInTo({
        "headers": {
          "to":["Me Vojta <vojta.jina@gmail.com>, Sir I. Newton <newton@gmail.com>"],
        }
      })).toBe(false);
    });

    it('should be true if the only one in TO', function() {
      expect(vojtaIsTheOnlyOneInTo({
        "headers": {
          "to":["Me Vojta <vojta.jina@gmail.com>"],
        }
      })).toBe(true);
    });

    it('should be false if not in TO', function() {
      expect(vojtaIsTheOnlyOneInTo({
        "headers": {
          "to":["Sir I. Newton <newton@gmail.com>"],
        }
      })).toBe(false);
    });
  });

  describe('isOnlyCC', function() {
    var vojtaOnlyCC = conditions.isOnlyCC('vojta.jina@gmail.com');

    it('should be true if not in TO and only in CC', function() {
      expect(vojtaOnlyCC({
        "headers": {
          "to":["Joseph Carter <mojocarter79@gmail.com>"],
          "cc":["Eric Podolsky <espodo@gmail.com>, Vojta Jína <vojta.jina@gmail.com>, Mike mulqueen <soulfunkgroove@yahoo.com>"]
        }
      })).toBe(true);
    });

    it('should be false if both in TO and CC', function() {
      expect(vojtaOnlyCC({
        "headers": {
          "to":["Me Vojta <vojta.jina@gmail.com>"],
          "cc":["Eric Podolsky <espodo@gmail.com>, Vojta Jína <vojta.jina@gmail.com>, Mike mulqueen <soulfunkgroove@yahoo.com>"]
        }
      })).toBe(false);
    });
  });

  describe('hasAnyCustomGmailLabels', function() {
    var hasAnyGmailLabel = conditions.hasAnyCustomGmailLabels('Ignored');

    it('should be true when there is any label', function() {
      expect(hasAnyGmailLabel({
        "attrs": {
          "x-gm-labels": [
            "GitHub/other"
          ]
        }
      })).toBe(true);
    });

    it('should be false when there is no label', function() {
      expect(hasAnyGmailLabel({
        "attrs": {
          "x-gm-labels": []
        }
      })).toBe(false);
    });

    it('should ignore Gmail default labels', function() {
      expect(hasAnyGmailLabel({
        "attrs": {
          "x-gm-labels": [
            "\\Important",
            "\\Inbox",
            "\\Sent"
          ]
        }
      })).toBe(false);
    });

    it('should ignore ignored labels', function() {
      expect(hasAnyGmailLabel({
        "attrs": {
          "x-gm-labels": [
            "Ignored"
          ]
        }
      })).toBe(false);
    });
  });

  describe('hasGmailLabel', function() {

    it('should be true when a specific label is present', function() {
      var hasFooGmailLabel = conditions.hasGmailLabel('foo');

      expect(hasFooGmailLabel({
        "attrs": {
          "x-gm-labels": [
            "whateva",
            "foo"
          ]
        }
      })).toBe(true);
    });

    it('should be false when a specific label is not present', function() {
      var hasFooGmailLabel = conditions.hasGmailLabel('foo');

      expect(hasFooGmailLabel({
        "attrs": {
          "x-gm-labels": [
            "whateva"
          ]
        }
      })).toBe(false);
    });
  });

  describe('isMomSpam', function() {
    var isMomSpam = conditions.isMomSpam();

    it('should match FW:', function() {
      expect(isMomSpam({
        "headers": {
          "subject": ["FW: Something"],
          "date": ["2015-10-22"]
        },
        "thread": []
      })).toBe(true);
      expect(isMomSpam({
        "headers": {
          "subject": ["Fw: Something"],
          "date": ["2015-10-22"]
        },
        "thread": []
      })).toBe(true);
    });

    it('should match FWD:', function() {
      expect(isMomSpam({
        "headers": {
          "subject": ["FWD: Something"],
          "date": ["2015-10-22"]
        },
        "thread": []
      })).toBe(true);
      expect(isMomSpam({
        "headers": {
          "subject": ["Fwd: Something"],
          "date": ["2015-10-22"]
        },
        "thread": []
      })).toBe(true);
    });

    it('should only match if first message in a thread', function() {
      expect(isMomSpam({
        "headers": {
          "subject": ["FW: Something"],
          "date": ["2015-10-22"]
        },
        // Here is one message before,
        // so it's not the start of the thread.
        "thread": [{
          "headers": {
            "date": ["2015-10-21"]
          }
        }, {
          "headers": {
            "date": ["2015-10-22"]
          }
        }]
      })).toBe(false);
    });
  });

  describe('earlierMessageInThreadFrom', function() {
    var earlierMessageFromVojta = conditions.earlierMessageInThreadFrom('vojta.jina@gmail.com');

    it('first message', function() {
      expect(earlierMessageFromVojta({
        "headers": {
          "date": ["2015-10-22"]
        },
        // Both messages are later in the thread.
        "thread": [{
          // The message itself.
          "headers": {
            "date": ["2015-10-22"]
          },
        }, {
          "headers": {
            "from": ["Vojta <vojta.jina@gmail.com"],
            "date": ["2015-10-24"]
          }
        }, {
          "headers": {
            "from": ["Vojta <vojta.jina@gmail.com"],
            "date": ["2015-10-25"]
          }
        }]
      })).toBe(false);
    });

    it('previous message from vojta', function() {
      expect(earlierMessageFromVojta({
        "headers": {
          "date": ["2015-10-22"]
        },
        "thread": [{
          "headers": {
            "from": ["Somebody <sss@goo.bar>"],
            "date": ["2015-10-20"]
          },
        }, {
          "headers": {
            "from": ["Vojta <vojta.jina@gmail.com>"],
            "date": ["2015-10-21"]
          }
        }, {
          // The message itself.
          "headers": {
            "date": ["2015-10-22"]
          }
        }]
      })).toBe(true);
    });
  });
});

