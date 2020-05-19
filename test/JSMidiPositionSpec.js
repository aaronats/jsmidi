const { expect } = require('chai');
const { JSMidi, JSMidiPosition } = require('../src');

describe('JSMidiPosition', function () {
  before(() => {
    JSMidi.reset();
  });

  describe('constructor()', () => {
    it('should initialize and expand a position', function () {
      const position = new JSMidiPosition('1:@1:1,2');

      expect(position).to.eql({
        parts: '1',
        bars: '1,3',
        beats: '1,2',
        position: '1:@1:1,2'
      });
    });
  });

  describe('_expand()', () => {
    it('should expand bars', function () {
      const position = new JSMidiPosition('*:@1:1');

      expect(position).to.eql({
        parts: '*',
        bars: '1,3',
        beats: '1',
        position: '*:@1:1'
      });
    });

    it('should expand beats', function () {
      const position = new JSMidiPosition('1,2:@1:@2');

      expect(position).to.eql({
        parts: '1,2',
        bars: '1,3',
        beats: '2,4,6,8,10,12,14,16',
        position: '1,2:@1:@2'
      });
    });

    it('should expand parts', function () {
      JSMidi.loop.update({
        parts: [
          { bars: 1, beats: 4 },
          { bars: 1, beats: 8 }
        ]
      });

      const position = new JSMidiPosition('*:*:1');

      expect(position).to.eql({
        parts: '1,2',
        bars: '*',
        beats: '1',
        position: '*:*:1'
      });
    });
  });

  describe('_every()', () => {
    it('should return a string of every nth in array', function () {
      const position = new JSMidiPosition('1:@1:0,2');
      const res = position._every(1, [1, 2, 3, 4, 5, 6, 7]);

      expect(res).to.eq('1,3,5,7');
    });
  });
});
