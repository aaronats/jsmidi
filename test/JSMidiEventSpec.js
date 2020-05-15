const { expect } = require('chai');
const { JSMidi, JSMidiEvent } = require('../src');

describe('JSMidiEvent', function () {
  const event = new JSMidiEvent('noteon', 1, {
    data: 64, hold: 0.5, after: 0.5
  });

  describe('constructor()', () => {
    it('should initialize correctly', function () {
      expect(event.data).to.eq(64);
      expect(event.channel).to.eq(1);
      expect(event.type).to.eq('noteon');
      expect(event.velocity).to.eq(98);
      expect(event.after).to.eq(0.5);
      expect(event.hold).to.eq(0.5);
    });

    it('should throw for an invalid type', function () {
      expect(() => {
         new JSMidiEvent('sysex'); //eslint-disable-line
      }).to.throw();
    });
  });

  describe('message()', () => {
    it('should build the correct midi message', function () {
      const message = event.message();

      expect(message).to.eql([145, 64, 98]);
    });
  });

  describe('calculateHold()', () => {
    it('should calculate hold at 1/2 of the midi time interval', function () {
      JSMidi.loop.setTempo(120);
      const hold = event.calculateHold(JSMidi.loop);

      expect(hold).to.eq(250);
    });
  });

  describe('calculateAfter()', () => {
    it('should calculate after at 1/2 of the midi time interval', function () {
      JSMidi.loop.setTempo(60);
      const after = event.calculateAfter(JSMidi.loop);

      expect(after).to.eq(500);
    });
  });
});
