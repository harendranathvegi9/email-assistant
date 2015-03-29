var isOnlyCC = require('./conditions').isOnlyCC;
var parseEmails = require('./conditions').parseEmails;
var isTheOnlyOne = require('./conditions').isTheOnlyOne;
var hasGmailLabel = require('./conditions').hasGmailLabel;
var isInTo = require('./conditions').isInTo;
var isMomSpam = require('./conditions').isMomSpam;

describe('conditions', function() {
  describe('parseEmails', function() {
    it('should parse', function() {
      expect(parseEmails('Vojta Jina <vojta.jina@gmail.com>, Mike <soul@yahoo.com>')).toEqual(['vojta.jina@gmail.com', 'soul@yahoo.com']);
    });
  });

  describe('isInTo', function() {
    var vojtaIsInTo = isInTo('vojta.jina@gmail.com');

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
    var vojtaIsTheOnlyOneInTo = isTheOnlyOne('vojta.jina@gmail.com');

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
    var vojtaOnlyCC = isOnlyCC('vojta.jina@gmail.com');

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


  describe('hasGmailLabel', function() {

    it('should be true when there is any label', function() {
      var hasAnyGmailLabel = hasGmailLabel();

      expect(hasAnyGmailLabel({
        "attrs": {
          "x-gm-labels": [
            "GitHub/other"
          ]
        }
      })).toBe(true);
    });

    it('should be false when there is no label', function() {
      var hasAnyGmailLabel = hasGmailLabel();

      expect(hasAnyGmailLabel({
        "attrs": {
          "x-gm-labels": []
        }
      })).toBe(false);
    });

    it('should ignore Gmail default labels', function() {
      var hasAnyGmailLabel = hasGmailLabel();

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

    it('should be true when a specific label is present', function() {
      var hasFooGmailLabel = hasGmailLabel('foo');

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
      var hasFooGmailLabel = hasGmailLabel('foo');

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
    var isMomSpam_ = isMomSpam();

    it('should match FW:', function() {
      expect(isMomSpam_({
        "headers": {
          "subject": ["FW: Something"],
          "date": ["2015-10-22"]
        },
        "thread": []
      })).toBe(true);
      expect(isMomSpam_({
        "headers": {
          "subject": ["Fw: Something"],
          "date": ["2015-10-22"]
        },
        "thread": []
      })).toBe(true);
    });

    it('should match FWD:', function() {
      expect(isMomSpam_({
        "headers": {
          "subject": ["FWD: Something"],
          "date": ["2015-10-22"]
        },
        "thread": []
      })).toBe(true);
      expect(isMomSpam_({
        "headers": {
          "subject": ["Fwd: Something"],
          "date": ["2015-10-22"]
        },
        "thread": []
      })).toBe(true);
    });

    it('should only match if first message in a thread', function() {
      expect(isMomSpam_({
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
});

