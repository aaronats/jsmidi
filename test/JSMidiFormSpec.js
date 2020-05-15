const { expect } = require('chai');
const { JSMidiForm } = require('../src');

describe('JSMidiForm', function () {
  describe('constructor()', () => {
    it('should initialize a with regular object', function () {
      const form = new JSMidiForm();

      expect(form.bars).to.eq(4);
      expect(form.beats).to.eq(16);
      expect(form.parts).to.eql([]);
      expect(form.bounds).to.eql([
        [0, 0, 0], [0, 3, 15]
      ]);
    });
  });

  describe('reset()', () => {
    const form = new JSMidiForm();

    it('should update the form', function () {
      form.reset({ bars: 1, beats: 4 });

      expect(form.bars).to.eq(1);
      expect(form.beats).to.eq(4);
    });

    it('should reset the form', function () {
      form.reset();

      expect(form.bars).to.eq(4);
      expect(form.beats).to.eq(16);
      expect(form.parts).to.eql([]);
      expect(form.bounds).to.eql([
        [0, 0, 0], [0, 3, 15]
      ]);
    });
  });

  describe('updateBounds()', () => {
    const form = new JSMidiForm();

    it('should update the bounds', function () {
      form.updateBounds('0:0:2', '0:0:8');

      expect(form.bounds).to.eql([
        [0, 0, 2], [0, 0, 8]
      ]);
    });

    it('should throw for invalid bounds', function () {
      expect(() => {
        form.updateBounds('0:4:0', '0:0:0');
      }).to.throw();
    });
  });

  describe('setBounds()', () => {
    const form = new JSMidiForm();

    it('should reset the bounds', function () {
      form.updateBounds('0:0:2', '0:0:8');
      form.setBounds();

      expect(form.bounds).to.eql([
        [0, 0, 0], [0, 3, 15]
      ]);
    });
  });

  describe('getFirstPosition()', () => {
    describe('without parts', () => {
      const form = new JSMidiForm();

      it('should return the first position', function () {
        const pos = form.getFirstPosition();
        expect(pos).to.eql([0, 0, 0]);
      });
    });

    describe('with parts', () => {
      const form = new JSMidiForm({
        parts: [
          { bars: 1, beats: 4 },
          { bars: 2, beats: 8 }
        ]
      });

      it('should return the first position', function () {
        const pos = form.getFirstPosition();
        expect(pos).to.eql([0, 0, 0]);
      });
    });
  });

  describe('getLastPosition()', () => {
    describe('without parts', () => {
      const form = new JSMidiForm();

      it('should return the last position', function () {
        const pos = form.getLastPosition();
        expect(pos).to.eql([0, 3, 15]);
      });
    });

    describe('with parts', () => {
      const form = new JSMidiForm({
        parts: [
          { bars: 1, beats: 4 },
          { bars: 2, beats: 8 }
        ]
      });

      it('should return the last position', function () {
        const pos = form.getLastPosition();
        expect(pos).to.eql([1, 1, 7]);
      });
    });
  });

  describe('setLowerBounds()', () => {
    const form = new JSMidiForm();

    // no need to call it directly since
    // it is called in the constructor.
    it('should set the bounds first position', function () {
      expect(form.bounds[0]).to.eql([0, 0, 0]);
    });
  });

  describe('setUpperBounds()', () => {
    const form = new JSMidiForm();

    // no need to call it directly since
    // it is called in the constructor.
    it('should set the bounds last position', function () {
      expect(form.bounds[1]).to.eql([0, 3, 15]);
    });
  });

  describe('getPart()', () => {
    const form = new JSMidiForm({
      parts: [
        { bars: 1, beats: 4 },
        { bars: 2, beats: 8 }
      ]
    });

    it('should get the part at index', function () {
      const part = form.getPart(1);
      expect(part).to.eql({ bars: 2, beats: 8 });
    });
  });

  describe('getFirstPart()', () => {
    const form = new JSMidiForm({
      parts: [
        { bars: 1, beats: 4 },
        { bars: 2, beats: 8 }
      ]
    });

    it('should get the first part', function () {
      const part = form.getFirstPart();
      expect(part).to.eql({ bars: 1, beats: 4 });
    });
  });

  describe('getLastPart()', () => {
    const form = new JSMidiForm({
      parts: [
        { bars: 1, beats: 4 },
        { bars: 2, beats: 8 }
      ]
    });

    it('should get the last part', function () {
      const part = form.getLastPart();
      expect(part).to.eql({ bars: 2, beats: 8 });
    });
  });

  describe('hasParts()', () => {
    const form = new JSMidiForm({
      parts: [
        { bars: 1, beats: 4 },
        { bars: 2, beats: 8 }
      ]
    });

    it('should return true if it has parts', function () {
      const res = form.hasParts();
      expect(res).to.eq(true);
    });
  });
});
