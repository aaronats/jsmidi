const { expect } = require('chai');
const { JSMidiBuilder } = require('../src');

describe('JSMidiBuilder', function () {
  describe('build()', () => {
    it('should bulid from the main object', function () {
      const res = JSMidiBuilder.notes('C4').h(2).a(1);

      expect(res.action).to.eql({
        notes: 'C4', hold: 2, after: 1
      });
    });

    it('should bulid from a deconstructed method', function () {
      const { chord } = JSMidiBuilder;
      const res = chord('C5M').h(1).v(120);

      expect(res.action).to.eql({
        chord: 'C5M', velocity: 120, hold: 1
      });
    });
  });
});
