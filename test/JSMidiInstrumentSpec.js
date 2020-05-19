const { expect } = require('chai');
const { JSMidi, JSMidiInstrument } = require('../src');

describe('JSMidiInstrument', function () {
  const { notes, chord } = JSMidi.builder;

  describe('init()', () => {
    const piano = new JSMidiInstrument('piano', { channel: 1 });

    it('should initialize correctly', function () {
      expect(piano.name).to.eq('piano');
      expect(piano.channel).to.eq(1);
      expect(piano.tracking).to.eql({});
      expect(piano.events).to.eql({});
    });
  });

  describe('play()', () => {
    const piano = new JSMidiInstrument('piano');
    piano.play('*:*:1', { notes: 'C4', velocity: 127, hold: 1 });

    it('should track actions at position', function () {
      expect(piano.tracking['*:*:1|noteon|60']).to.eq(true);
    });

    it('should queue events at position', function () {
      const event = piano.events['*:*:1'][0];

      expect(event.data).to.eq(60);
      expect(event.type).to.eq('noteon');
      expect(event.velocity).to.eq(127);
      expect(event.hold).to.eq(1);
    });
  });

  describe('stop()', () => {
    const piano = new JSMidiInstrument('piano');
    piano.stop('1:1:2', notes('C4'));

    it('should track actions at position', function () {
      expect(piano.tracking['1:1:2|noteoff|60']).to.eq(true);
    });

    it('should queue events at position', function () {
      const event = piano.events['1:1:2'][0];

      expect(event.data).to.eq(60);
      expect(event.type).to.eq('noteoff');
      expect(event.velocity).to.eq(0);
    });
  });

  describe('pattern()', () => {
    const drums = new JSMidiInstrument('drums');

    it('should throw if after is included in the action', function () {
      const piano = new JSMidiInstrument('piano');

      expect(() => {
        piano.pattern('1:1:1', { notes: 'C2', after: 0.5 }, [0.5, 0.5]);
      }).to.throw();
    });

    it('should sequence a pattern starting at position', function () {
      drums.pattern('1:1:1', { notes: 'C2', velocity: 80 }, [
        0.5, 0.5, -1, 0.5, 1
      ]);

      const expected = {
        '1:1:1': [
          { hold: 0.5, after: 0 },
          { hold: 0.5, after: 0.5 }
        ],
        '1:1:3': [
          { hold: 0.5, after: 0 },
          { hold: 1, after: 0.5 }
        ]
      };

      Object.entries(expected).forEach(([key, val]) => {
        const events = drums.events[key];

        expect(events).to.be.an('array');
        expect(events.length).to.eq(val.length);
        val.forEach((item, idx) => {
          expect(events[idx].hold).to.eq(item.hold);
          expect(events[idx].after).to.eq(item.after);
          expect(events[idx].velocity).to.eq(80);
        });
      });
    });
  });

  describe('sequence()', () => {
    it('should throw if wildcard geven for beat', function () {
      const piano = new JSMidiInstrument('piano');

      expect(() => {
        piano.sequence('*:*:*', [
          { notes: 'C4', hold: 1 },
          { notes: 'C5', hold: 1 }
        ]);
      }).to.throw();
    });

    it('should queue events at the correct positions', function () {
      const piano = new JSMidiInstrument('piano');

      piano.sequence('*:*:1', [
        { notes: 'C5', hold: 0.5 },
        { notes: 'A5', hold: 0.5 },
        { notes: 'F5', hold: 0.5 },
        { notes: 'F5', hold: 0.5 }
      ]);

      const expected = {
        '*:*:1': [
          { hold: 0.5, after: 0 },
          { hold: 0.5, after: 0.5 }
        ],
        '*:*:2': [
          { hold: 0.5, after: 0 },
          { hold: 0.5, after: 0.5 }
        ]
      };

      Object.entries(expected).forEach(([key, val]) => {
        const events = piano.events[key];

        expect(events).to.be.an('array');
        expect(events.length).to.eq(val.length);
        val.forEach((item, idx) => {
          expect(events[idx].hold).to.eq(item.hold);
          expect(events[idx].after).to.eq(item.after);
        });
      });
    });

    it('should queue events at the correct positions', function () {
      const piano = new JSMidiInstrument('piano');

      piano.sequence('*:*:1', [
        { notes: 'C5', hold: 1 },
        { notes: 'A5', hold: 0.5 },
        { notes: 'F5', hold: 1.5 },
        { notes: 'F5', hold: 0.8 }
      ]);

      const expected = {
        '*:*:1': [
          { hold: 1, after: 0 }
        ],
        '*:*:2': [
          { hold: 0.5, after: 0 },
          { hold: 1.5, after: 0.5 }
        ],
        '*:*:4': [
          { hold: 0.8, after: 0 }
        ]
      };

      Object.entries(expected).forEach(([key, val]) => {
        const events = piano.events[key];

        expect(events).to.be.an('array');
        expect(events.length).to.eq(val.length);
        val.forEach((item, idx) => {
          expect(events[idx].hold).to.eq(item.hold);
          expect(events[idx].after).to.eq(item.after);
        });
      });
    });

    it('should queue events at the correct positions', function () {
      const piano = new JSMidiInstrument('piano');

      piano.sequence('*:*:1', [
        notes('C4').h(1).a(1),
        notes('F4').h(0.5)
      ]);

      const expected = {
        '*:*:2': [
          { hold: 1, after: 0 }
        ],
        '*:*:3': [
          { hold: 0.5, after: 0 }
        ]
      };

      Object.entries(expected).forEach(([key, val]) => {
        const events = piano.events[key];

        expect(events).to.be.an('array');
        expect(events.length).to.eq(val.length);
        val.forEach((item, idx) => {
          expect(events[idx].hold).to.eq(item.hold);
          expect(events[idx].after).to.eq(item.after);
        });
      });
    });
  });

  describe('noteOn()', () => {
    const piano = new JSMidiInstrument('piano');
    piano.noteOn('*:*:1', 'C4', { velocity: 100, hold: 1 });

    it('should queue the noteon event at position', function () {
      const event = piano.events['*:*:1'][0];

      expect(event.data).to.eq(60);
      expect(event.type).to.eq('noteon');
      expect(event.velocity).to.eq(100);
      expect(event.hold).to.eq(1);
    });
  });

  describe('noteOff()', () => {
    const piano = new JSMidiInstrument('piano');
    piano.noteOff('*:*:1', 'C4', { after: 0.5 });

    it('should queue the noteoff event at position', function () {
      const event = piano.events['*:*:1'][0];

      expect(event.data).to.eq(60);
      expect(event.type).to.eq('noteoff');
      expect(event.velocity).to.eq(0);
      expect(event.after).to.eq(0.5);
    });
  });

  describe('sustainOn()', () => {
    const piano = new JSMidiInstrument('piano');
    piano.sustainOn('*:*:1', { hold: 1 });

    it('should queue the noteon event at position', function () {
      const event = piano.events['*:*:1'][0];

      expect(event.data).to.eq(64);
      expect(event.type).to.eq('sustainon');
      expect(event.velocity).to.eq(127);
      expect(event.hold).to.eq(1);
    });
  });

  describe('sustainOff()', () => {
    const piano = new JSMidiInstrument('piano');
    piano.sustainOff('*:*:1', { after: 0.5 });

    it('should queue the noteon event at position', function () {
      const event = piano.events['*:*:1'][0];

      expect(event.data).to.eq(64);
      expect(event.type).to.eq('sustainoff');
      expect(event.velocity).to.eq(0);
      expect(event.after).to.eq(0.5);
    });
  });

  describe('at()', () => {
    const piano = new JSMidiInstrument('piano');

    piano.at('1:1:1', [
      notes(['C4']).h(0.5),
      chord('C5M').h(0.5).v(120)
    ]);

    it('should track actions at position', function () {
      expect(piano.tracking['1:1:1|noteon|60']).to.eq(true);
      expect(piano.tracking['1:1:1|noteon|72']).to.eq(true);
      expect(piano.tracking['1:1:1|noteon|76']).to.eq(true);
      expect(piano.tracking['1:1:1|noteon|79']).to.eq(true);
    });

    it('should schedule events at position', function () {
      const events = piano.events['1:1:1'];
      const notes = [[60, 98], [72, 120], [76, 120], [79, 120]];

      events.forEach((event, i) => {
        expect(event.type).to.eq('noteon');
        expect(event.data).to.eq(notes[i][0]);
        expect(event.velocity).to.eq(notes[i][1]);
        expect(event.hold).to.eq(0.5);
      });
    });
  });

  describe('rest()', () => {
    it('should rest at every position in the same part and bar', function () {
      const piano = new JSMidiInstrument('piano');
      const rests = ['1:1:8', '1:1:9', '1:1:10', '1:1:11'];

      piano.rest('1:1:8', '1:1:11');

      rests.forEach(pos => {
        expect(piano.rests[pos]).to.eq(true);
      });
    });

    it('should rest at every position with different bars', function () {
      const piano = new JSMidiInstrument('piano');
      const rests = ['1:1:14', '1:1:15', '1:1:16', '1:2:1', '1:2:2', '1:2:3'];

      piano.rest('1:1:14', '1:2:3');

      expect(Object.keys(piano.rests).length).to.eq(rests.length);
      rests.forEach(pos => { expect(piano.rests[pos]).to.eq(true); });
    });

    it('should throw if start or end positions are invalid', function () {
      const piano = new JSMidiInstrument('piano');

      expect(() => { piano.rest('1:1:p', '1:1:1'); }).to.throw();
      expect(() => { piano.rest('1:1-1', '1:1:1'); }).to.throw();
      expect(() => { piano.rest('1:1:1', '1:1-1'); }).to.throw();
    });

    it('should throw if range is invalid', function () {
      const piano = new JSMidiInstrument('piano');

      expect(() => { piano.rest('1:1:10', '1:1:1'); }).to.throw();
      expect(() => { piano.rest('1:2:10', '1:1:12'); }).to.throw();
      expect(() => { piano.rest('2:1:1', '1:1:1'); }).to.throw();
      expect(() => { piano.rest('2:1:10', '2:1:8'); }).to.throw();
    });
  });
});
