const { expect } = require('chai');
const NanoTimer = require('nanotimer');
const Events = require('eventemitter2').EventEmitter2;
const { JSMidiLoop, JSMidiForm } = require('../src');

describe('JSMidiLoop', function () {
  const loop = new JSMidiLoop();
  loop.setTempo(1000); // faster tests

  describe('constructor()', () => {
    it('should initialize with defaults', function () {
      expect(loop.bar).to.eq(0);
      expect(loop.beat).to.eq(0);
      expect(loop.part).to.eql(0);
      expect(loop.offset).to.eq(100);
      expect(loop.repeat).to.eq(false);
      expect(loop.restarts).to.eq(0);
      expect(loop.maxRestarts).to.eq(16);
      expect(loop.playing).to.eq(false);
      expect(loop.position).to.eq('0:0:0');
      expect(loop.events).to.be.instanceof(Events);
      expect(loop.timer).to.be.instanceof(NanoTimer);
      expect(loop.form).to.be.instanceof(JSMidiForm);
    });
  });

  describe('update()', () => {
    describe('without parts', () => {
      it('should update the form without parts', function () {
        loop.update({ bars: 1, beats: 4 });

        expect(loop.form.bars).to.eq(1);
        expect(loop.form.beats).to.eq(4);
        expect(loop.form.parts).to.eql([]);
        expect(loop.form.bounds).to.eql([
          [0, 0, 0], [0, 0, 3]
        ]);
      });
    });

    describe('with parts', () => {
      it('should update the form with parts', function () {
        loop.update({
          parts: [
            { bars: 1, beats: 4 },
            { bars: 2, beats: 8 }
          ]
        });

        expect(loop.form.bars).to.eq(4);
        expect(loop.form.beats).to.eq(16);
        expect(loop.form.parts).to.eql([
          { bars: 1, beats: 4 },
          { bars: 2, beats: 8 }
        ]);
        expect(loop.form.bounds).to.eql([
          [0, 0, 0], [1, 1, 7]
        ]);
      });
    });
  });

  describe('start()', () => {
    before(() => {
      loop.update({ bars: 1, beats: 4 });
    });

    after(() => {
      loop.events.removeAllListeners();
    });

    it('should start the loop', function (done) {
      loop.update({ bars: 1, beats: 4 });
      const positions = [0, 1, 2, 3].map(i => `0:0:${i}`);

      loop.events.on('position', (position) => {
        expect(loop.playing).to.eq(true);
        expect(positions).to.include(position);
      });

      // make sure we stop
      setTimeout(() => {
        loop.stop();
        done();
      }, 500);

      loop.start();
    });
  });

  describe('stop()', () => {
    before(() => {
      loop.update({ bars: 1, beats: 4 });
    });

    after(() => {
      loop.events.removeAllListeners();
    });

    it('should stop the loop at 0:0:2', function (done) {
      loop.events.on('position', (position) => {
        expect(loop.playing).to.eq(true);
        if (position === '0:0:2') {
          loop.stop();
        }
      });

      loop.events.on('stop', function () {
        expect(loop.playing).to.eq(false);
      });

      // make sure we stop
      setTimeout(() => {
        loop.stop();
        done();
      }, 500);

      loop.start();
    });
  });

  describe('restart()', () => {
    before(() => {
      loop.update({ bars: 1, beats: 4 });
    });

    after(() => {
      loop.events.removeAllListeners();
    });

    it('should restart the loop at 0:0:2 and never hit 0:0:3', function (done) {
      loop.events.on('position', (position) => {
        expect(position).to.not.eq('0:0:3');
        if (position === '0:0:2') {
          loop.restart();
        }
      });

      // make sure we stop
      setTimeout(() => {
        loop.stop();
        done();
      }, 500);

      loop.start();
    });
  });

  describe('repeatSection()', () => {
    before(() => {
      loop.update({ bars: 1, beats: 4 });
    });

    after(() => {
      loop.events.removeAllListeners();
    });

    it('should set the start and end positions to repeat', function () {
      loop.repeatSection('0:0:0', '0:0:2');

      console.log(loop.form);

      const sp = loop.form.getFirstPosition();
      const ep = loop.form.getLastPosition();

      expect(sp).to.eql([0, 0, 0]);
      expect(ep).to.eql([0, 0, 2]);
    });

    it('should repeat section 0:0:0 to 0:0:2 and never hit 0:0:3', function (done) {
      loop.events.on('position', (position) => {
        expect(position).to.not.eq('0:0:3');
      });

      // make sure we stop
      setTimeout(() => {
        loop.stop();
        done();
      }, 500);

      loop.start();
    });
  });

  describe('repeat', () => {
    describe('enableRepeat()', () => {
      it('should set repeat to true', function () {
        loop.enableRepeat();
        expect(loop.repeat).to.eq(true);
      });
    });

    describe('disableRepeat()', () => {
      it('should set repeat to false', function () {
        loop.disableRepeat();
        expect(loop.repeat).to.eq(false);
      });
    });
  });

  describe('reset()', () => {
    it('should reset the loop', function () {
      loop.reset();

      expect(loop.bar).to.eq(0);
      expect(loop.beat).to.eq(0);
      expect(loop.part).to.eql(0);
      expect(loop.bpm).to.eq(120);
      expect(loop.interval).to.eq(500);
      expect(loop.repeat).to.eq(false);
      expect(loop.restarts).to.eq(0);
      expect(loop.playing).to.eq(false);
      expect(loop.position).to.eq('0:0:0');
    });
  });

  describe('_setCurrentPosition()', () => {
    it('should set the current position', function () {
      [loop.bar, loop.beat] = [0, 2];
      loop._setCurrentPosition();

      expect(loop.position).to.eq('0:0:2');
    });
  });

  describe('_incrementPosition()', () => {
    describe('without parts', (done) => {
      before(() => {
        loop.reset();
        loop.update({ bars: 2, beats: 4 });
      });

      it('should start at 0:0:0', function () {
        expect(loop.position).to.eq('0:0:0');
      });

      it('should move to the next beat', function () {
        loop._incrementPosition();

        expect(loop.position).to.eq('0:0:1');
      });

      it('should move to the next bar', function () {
        [loop.bar, loop.beat] = [0, 3];

        loop._incrementPosition();

        expect(loop.position).to.eq('0:1:0');
      });
    });

    describe('with parts', () => {
      before(() => {
        loop.reset();
        loop.update({
          parts: [
            { bars: 1, beats: 4 },
            { bars: 2, beats: 8 }
          ]
        });
      });

      it('should start at 0:0:0', function () {
        expect(loop.position).to.eq('0:0:0');
      });

      it('should move to the next beat', function () {
        loop._incrementPosition();

        expect(loop.position).to.eq('0:0:1');
      });

      it('should move to the next bar', function () {
        [loop.bar, loop.beat] = [1, 3];
        loop._incrementPosition();

        expect(loop.position).to.eq('0:2:0');
      });

      it('should move to the next part', function () {
        [loop.part, loop.bar, loop.beat] = [0, 0, 3];
        loop._incrementPosition();

        expect(loop.position).to.eq('1:0:0');
      });
    });
  });

  describe('_broadcastPosition()', () => {
    before(() => {
      loop.reset();
    });

    after(() => {
      loop.events.removeAllListeners();
    });

    it('should broadcast the position', function (done) {
      loop.events.on('position', (position) => {
        expect(position).to.eq('0:0:0');
        done();
      });

      loop._broadcastPosition();
    });
  });

  describe('_advance()', () => {
    before(() => {
      loop.reset();
      loop.update({ bars: 1, beats: 4 });
    });

    after(() => {
      loop.events.removeAllListeners();
    });

    it('should advance to the next the position', function (done) {
      loop._advance();

      // wait for the loop's timeout
      setTimeout(() => {
        expect(loop.position).to.eq('0:0:1');
        done();
      }, 600);
    });
  });

  describe('_getNextPosition()', () => {
    describe('without parts', () => {
      before(() => {
        loop.reset();
        loop.update({ bars: 1, beats: 4 });
      });

      it('should return the next position at the start', function () {
        const np = loop._getNextPosition();
        expect(np).to.eq('0:0:1');
      });

      it('should return the next position in the middle', function () {
        [loop.bar, loop.beat] = [0, 1];
        const np = loop._getNextPosition();
        expect(np).to.eq('0:0:2');
      });

      it('should return the next position at the end', function () {
        [loop.bar, loop.beat] = [0, 3];
        const np = loop._getNextPosition();
        expect(np).to.eq('0:1:0');
      });
    });

    describe('with parts', () => {
      before(() => {
        loop.reset();
        loop.update({
          parts: [
            { bars: 1, beats: 4 },
            { bars: 2, beats: 8 }
          ]
        });
      });

      it('should return the next position at the start', function () {
        const np = loop._getNextPosition();
        expect(np).to.eq('0:0:1');
      });

      it('should return the next position after first part', function () {
        [loop.part, loop.bar, loop.beat] = [1, 0, 0];
        const np = loop._getNextPosition();
        expect(np).to.eq('1:0:1');
      });

      it('should return the next position at the end of the final part', function () {
        [loop.part, loop.bar, loop.beat] = [1, 1, 8];
        const np = loop._getNextPosition();
        expect(np).to.eq('2:0:0');
      });
    });
  });

  describe('_shouldRestart()', () => {
    before(() => {
      loop.reset();
      loop.update({ bars: 1, beats: 4 });
    });

    describe('without parts', () => {
      it('should return false when repeat flag is false', function () {
        const res = loop._shouldRestart();
        expect(res).to.eq(false);
      });

      it('should return false when not at the last bar and beat', function () {
        loop.enableRepeat();
        [loop.bar, loop.beat] = [0, 2];
        const res = loop._shouldRestart();

        expect(res).to.eq(false);
      });

      it('should return true at the last bar and beat', function () {
        loop.enableRepeat();
        [loop.bar, loop.beat] = [0, 3];
        const res = loop._shouldRestart();

        expect(res).to.eq(true);
      });

      it('should return true at the section end position', function () {
        loop.repeatSection('0:0:0', '0:0:3');
        [loop.bar, loop.beat] = [0, 3];
        const res = loop._shouldRestart();

        expect(res).to.eq(true);
      });
    });

    describe('with parts', () => {
      before(() => {
        loop.reset();
        loop.update({
          parts: [
            { bars: 1, beats: 4 },
            { bars: 2, beats: 8 }
          ]
        });
      });

      it('should return false when repeat flag is false', function () {
        const res = loop._shouldRestart();
        expect(res).to.eq(false);
      });

      it('should return true at the last part, bar and beat', function () {
        loop.enableRepeat();
        [loop.part, loop.bar, loop.beat] = [1, 1, 7];
        const res = loop._shouldRestart();

        expect(res).to.eq(true);
      });

      it('should return true at the section end position', function () {
        loop.repeatSection('0:0:0', '0:1:4');
        [loop.part, loop.bar, loop.beat] = [0, 1, 4];
        const res = loop._shouldRestart();

        expect(res).to.eq(true);
      });
    });

    describe('with maxRestarts', () => {
      const loop = new JSMidiLoop({ bars: 1, beats: 4 });

      it('should return false when maxRestarts is reached', function () {
        loop.restarts = 16;
        const res = loop._shouldRestart();
        expect(res).to.eq(false);
      });
    });
  });

  describe('_shouldStop()', () => {
    before(() => {
      loop.reset();
      loop.update({ bars: 2, beats: 4 });
    });

    describe('without parts', () => {
      it('should return false when repeat is true', function () {
        loop.enableRepeat();
        const res = loop._shouldStop();

        expect(res).to.eq(false);
      });

      it('should return false when not at the last bar', function () {
        loop.disableRepeat();
        [loop.bar, loop.beat] = [0, 3];
        const res = loop._shouldStop();

        expect(res).to.eq(false);
      });

      it('should return true at the last bar', function () {
        loop.disableRepeat();
        [loop.bar, loop.beat] = [1, 3];
        const res = loop._shouldStop();

        expect(res).to.eq(true);
      });
    });

    describe('with parts', () => {
      before(() => {
        loop.reset();
        loop.update({
          parts: [
            { bars: 1, beats: 4 },
            { bars: 2, beats: 8 }
          ]
        });
      });

      it('should return false when repeat is true', function () {
        loop.enableRepeat();
        const res = loop._shouldStop();

        expect(res).to.eq(false);
      });

      it('should return false when not at the last position', function () {
        loop.disableRepeat();
        [loop.part, loop.bar, loop.beat] = [1, 0, 3];
        const res = loop._shouldStop();

        expect(res).to.eq(false);
      });
    });
  });
});
