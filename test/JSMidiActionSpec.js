const { expect } = require('chai');
const { JSMidiAction, JSMidiBuilder } = require('../src');

describe('JSMidiAction', function () {
  describe('constructor()', () => {
    it('should initialize with a regular object', function () {
      const action = new JSMidiAction({
        notes: 'C4', hold: 1
      });

      expect(action.notes).to.eq('C4');
      expect(action.chord).to.eq(undefined);
      expect(action.velocity).to.eq(98);
      expect(action.hold).to.eq(1);
      expect(action.after).to.eq(0);
    });

    it('should initialize with a builder object', function () {
      const { chord } = JSMidiBuilder;
      const action = new JSMidiAction(
        chord('C4M').h(0.5).a(0.5)
      );

      expect(action.chord).to.eq('C4M');
      expect(action.velocity).to.eq(98);
      expect(action.hold).to.eq(0.5);
      expect(action.after).to.eq(0.5);
    });
  });

  describe('getNotes()', () => {
    it('should return an array of notes', function () {
      const action = new JSMidiAction({ notes: 'C4', hold: 1 });

      expect(action.getNotes()).to.eql(['C4']);
    });
  });

  describe('getEventOptions()', () => {
    it('should return an object of event options', function () {
      const action = new JSMidiAction({ notes: 'C4', hold: 1 });

      expect(action.getEventOptions()).to.eql({
        velocity: 98, hold: 1, after: 0
      });
    });
  });
});
