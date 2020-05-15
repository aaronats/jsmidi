const { expect } = require('chai');
const {
  JSMidi,
  JSMidiInstrument,
  JSMidiLoop,
  JSMidiIO
} = require('../src');

describe('JSMidi', function () {
  describe('constructor()', () => {
    it('should be an initialized singleton', function () {
      expect(JSMidi.tracks).to.eql({});
      expect(JSMidi.events).to.eql({});
      expect(JSMidi.io).to.be.instanceof(JSMidiIO);
      expect(JSMidi.loop).to.be.instanceof(JSMidiLoop);
      expect(JSMidi.builder).to.be.instanceof(Object);
    });
  });

  describe('tracks', () => {
    const piano = new JSMidiInstrument('piano');
    piano.play('*:*:*', { notes: 'C4', hold: 1 });

    describe('addTrack()', () => {
      it('should add an instrument to tracks', function () {
        JSMidi.addTrack(piano);

        expect(JSMidi.tracks.piano).to.eql(piano);
      });
    });

    describe('resetTracks()', () => {
      it('should reset tracks', function () {
        JSMidi.resetTracks();

        expect(piano.muted).to.eq(false);
        expect(piano.name).to.eq('piano');
        expect(piano.events).to.eql({});
        expect(piano.tracking).to.eql({});
      });
    });

    describe('removeTrack()', () => {
      it('should remove an instrument from tracks', function () {
        JSMidi.removeTrack(piano);

        expect(JSMidi.tracks.piano).to.eq(undefined);
      });
    });
  });

  describe('reset()', () => {
    it('should reset tracks and events', function () {
      JSMidi.reset();

      expect(JSMidi.events).to.eql({});
      expect(JSMidi.tracks).to.eql({});
    });
  });

  // TODO: allOff and fullReset tests

  describe('schedule()', () => {
    const drums = new JSMidiInstrument('drums');

    it('should schedule events at position', function () {
      JSMidi.reset();
      JSMidi.addTrack(drums);

      drums.play('*:*:1', { notes: 'C4' });
      drums.play('*:*:4', { notes: 'C5' });

      JSMidi.schedule('0:0:0', 0);
      JSMidi.schedule('0:0:1', 0);
      JSMidi.schedule('0:0:2', 0);
      JSMidi.schedule('0:0:3', 0);
      JSMidi.schedule('0:0:4', 0);

      expect(JSMidi.events['0|noteon|60']).to.eq(true);
      expect(JSMidi.events['0|noteon|72']).to.eq(true);
    });

    it('should ignore instrument rests', function () {
      JSMidi.reset();
      JSMidi.addTrack(drums);

      drums.rest('0:0:1', '0:0:3');
      drums.play('*:*:1', { notes: 'C4' });
      drums.play('*:*:4', { notes: 'C5' });

      JSMidi.schedule('0:0:0', 0);
      JSMidi.schedule('0:0:1', 0);
      JSMidi.schedule('0:0:2', 0);
      JSMidi.schedule('0:0:3', 0);
      JSMidi.schedule('0:0:4', 0);

      expect(JSMidi.events['0|noteon|60']).to.eq(undefined);
      expect(JSMidi.events['0|noteon|72']).to.eq(true);
    });

    it('should ignore a muted instrument', function () {
      JSMidi.reset();
      JSMidi.addTrack(drums);

      drums.mute();
      drums.play('*:*:0', { notes: 'C4' });
      drums.play('*:*:4', { notes: 'C5' });

      JSMidi.schedule('0:0:0', 0);
      JSMidi.schedule('0:0:1', 0);
      JSMidi.schedule('0:0:2', 0);
      JSMidi.schedule('0:0:3', 0);
      JSMidi.schedule('0:0:4', 0);

      expect(JSMidi.events).to.eql({});
    });
  });

  describe('scheduleEvent()', () => {
    const drums = new JSMidiInstrument('drums');

    it('should schedule an event at time', function () {
      JSMidi.reset();
      JSMidi.addTrack(drums);

      drums.play('*:*:0', { notes: 'A4' });
      drums.play('*:*:3', { notes: 'F5' });

      JSMidi.scheduleEvent(drums.events['*:*:0'][0], 0);
      JSMidi.scheduleEvent(drums.events['*:*:3'][0], 0);

      expect(JSMidi.events['0|noteon|69']).to.eq(true);
      expect(JSMidi.events['0|noteon|77']).to.eq(true);
    });
  });
});
