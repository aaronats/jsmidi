const { expect } = require('chai');
const NanoTimer = require('nanotimer');
const Events = require('eventemitter2').EventEmitter2;
const { JSMidiLoop, JSMidiForm } = require('../src');

describe('JSMidiLoop', function () {
  const loop = new JSMidiLoop();
  loop.setTempo(1000); // faster tests

  describe('constructor()', () => {
    it('should initialize with defaults', function () {
      expect(loop.bar).to.eq(1);
      expect(loop.beat).to.eq(1);
      expect(loop.part).to.eql(1);
      expect(loop.offset).to.eq(100);
      expect(loop.repeat).to.eq(false);
      expect(loop.restarts).to.eq(0);
      expect(loop.maxRestarts).to.eq(16);
      expect(loop.playing).to.eq(false);
      expect(loop.position).to.eq('1:1:1');
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
          [1, 1, 1], [1, 1, 4]
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
          [1, 1, 1], [2, 2, 8]
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
      const positions = [1, 2, 3, 4].map(i => `1:1:${i}`);

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

    it('should stop the loop at 1:1:2', function (done) {
      loop.events.on('position', (position) => {
        expect(loop.playing).to.eq(true);
        if (position === '1:1:2') {
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
      loop.reset();
      loop.update({ bars: 1, beats: 4 });
    });

    after(() => {
      loop.events.removeAllListeners();
    });

    it('should restart the loop at 1:1:2 and never hit 1:1:3', function (done) {
      loop.events.on('position', (position) => {
        expect(position).to.not.eq('1:1:3');
        if (position === '1:1:2') {
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

  describe('focus()', () => {
    before(() => {
      loop.update({ bars: 1, beats: 4 });
      loop.focus('1:1:1', '1:1:3');
    });

    after(() => {
      loop.events.removeAllListeners();
    });

    it('should set the start and end positions to repeat', function () {
      const sp = loop.form.getFirstPosition();
      const ep = loop.form.getLastPosition();

      expect(sp).to.eql([1, 1, 1]);
      expect(ep).to.eql([1, 1, 3]);
    });

    it('should repeat section 1:1:1 to 1:1:3 and never hit 1:1:4', function (done) {
      loop.events.on('position', (position) => {
        expect(position).to.not.eq('1:1:4');
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

      expect(loop.bar).to.eq(1);
      expect(loop.beat).to.eq(1);
      expect(loop.part).to.eql(1);
      expect(loop.bpm).to.eq(120);
      expect(loop.interval).to.eq(500);
      expect(loop.repeat).to.eq(false);
      expect(loop.restarts).to.eq(0);
      expect(loop.playing).to.eq(false);
      expect(loop.position).to.eq('1:1:1');
    });
  });

  describe('_setCurrentPosition()', () => {
    it('should set the current position', function () {
      [loop.bar, loop.beat] = [1, 2];
      loop._setCurrentPosition();

      expect(loop.position).to.eq('1:1:2');
    });
  });

  describe('_incrementPosition()', () => {
    describe('without parts', (done) => {
      before(() => {
        loop.reset();
        loop.update({ bars: 2, beats: 4 });
      });

      it('should start at 1:1:1', function () {
        expect(loop.position).to.eq('1:1:1');
      });

      it('should move to the next beat', function () {
        loop._incrementPosition();

        expect(loop.position).to.eq('1:1:2');
      });

      it('should move to the next bar', function () {
        [loop.bar, loop.beat] = [1, 4];

        loop._incrementPosition();

        expect(loop.position).to.eq('1:2:1');
      });
    });

    describe('with parts', () => {
      before(() => {
        loop.reset();
        loop.update({
          parts: [
            { bars: 2, beats: 4 },
            { bars: 2, beats: 8 }
          ]
        });
      });

      it('should start at 1:1:1', function () {
        expect(loop.position).to.eq('1:1:1');
      });

      it('should move to the next beat', function () {
        loop._incrementPosition();

        expect(loop.position).to.eq('1:1:2');
      });

      it('should move to the next bar', function () {
        [loop.bar, loop.beat] = [1, 4];
        loop._incrementPosition();

        expect(loop.position).to.eq('1:2:1');
      });

      it('should move to the next part', function () {
        [loop.part, loop.bar, loop.beat] = [1, 2, 4];
        loop._incrementPosition();

        expect(loop.position).to.eq('2:1:1');
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
        expect(position).to.eq('1:1:1');
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
        expect(loop.position).to.eq('1:1:2');
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
        expect(np).to.eq('1:1:2');
      });

      it('should return the next position in the middle', function () {
        [loop.bar, loop.beat] = [1, 2];
        const np = loop._getNextPosition();
        expect(np).to.eq('1:1:3');
      });

      it('should return the next position at the end', function () {
        [loop.bar, loop.beat] = [1, 4];
        const np = loop._getNextPosition();
        expect(np).to.eq('1:2:1');
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
        expect(np).to.eq('1:1:2');
      });

      it('should return the next position after first part', function () {
        [loop.part, loop.bar, loop.beat] = [1, 1, 4];
        const np = loop._getNextPosition();
        expect(np).to.eq('2:1:1');
      });

      it('should return the next position at the end of the final part', function () {
        [loop.part, loop.bar, loop.beat] = [2, 2, 8];
        const np = loop._getNextPosition();
        expect(np).to.eq('3:1:1');
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
        [loop.bar, loop.beat] = [1, 3];
        const res = loop._shouldRestart();

        expect(res).to.eq(false);
      });

      it('should return true at the last bar and beat', function () {
        loop.enableRepeat();
        [loop.bar, loop.beat] = [1, 4];
        const res = loop._shouldRestart();

        expect(res).to.eq(true);
      });

      it('should return true at the section end position', function () {
        loop.focus('1:1:1', '1:1:4');
        [loop.bar, loop.beat] = [1, 4];
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
        [loop.part, loop.bar, loop.beat] = [2, 2, 8];
        const res = loop._shouldRestart();

        expect(res).to.eq(true);
      });

      it('should return true at the section end position', function () {
        loop.focus('1:1:1', '1:1:4');
        [loop.part, loop.bar, loop.beat] = [1, 1, 4];
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

      it('should return false when bar is not greater than the last bar', function () {
        loop.disableRepeat();
        [loop.bar, loop.beat] = [1, 4];
        const res = loop._shouldStop();

        expect(res).to.eq(false);
      });

      it('should return true bar is greater than the last bar', function () {
        loop.disableRepeat();
        [loop.bar, loop.beat] = [3, 4];
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

      it('should return false when not greater than the last position', function () {
        loop.disableRepeat();
        [loop.part, loop.bar, loop.beat] = [2, 2, 8];
        const res = loop._shouldStop();

        expect(res).to.eq(false);
      });

      it('should return true when greater than the last position', function () {
        loop.disableRepeat();
        [loop.part, loop.bar, loop.beat] = [2, 3, 1];
        const res = loop._shouldStop();

        expect(res).to.eq(true);
      });
    });
  });
});
