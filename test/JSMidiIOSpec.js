const { expect } = require('chai');
const { JSMidiIO } = require('../src');

const performance = { now: require('performance-now') };
global.navigator = require('web-midi-api');

describe('JSMidiIO', function () {
  const io = new JSMidiIO();

  // This simulates getting the Web Midi API
  // and performance from the browser.
  before((done) => {
    navigator.requestMIDIAccess().then(function (midi) {
      io.setup(midi, performance);
      done();
    });
  });

  // We need to close the Midi access otherwise
  // it turns into a zombie node process.
  after(() => { navigator.close(); });

  describe('constructor()', () => {
    it('should initialize correctly', function () {
      expect(io).to.be.instanceof(JSMidiIO);
    });
  });

  describe('setup()', () => {
    it('should setup the IO', function () {
      expect(io.outputs.length).to.be.gt(0);
      expect(io.inputs.length).to.be.gt(0);
      expect(io.midi.constructor.name).to.eq('MIDIAccess');
      expect(io.input.constructor.name).to.eq('MIDIInput');
      expect(io.output.constructor.name).to.eq('MIDIOutput');
    });
  });

  describe('now()', () => {
    it('should get the performance time', function () {
      const time = io.now();
      expect(time).to.be.a('number');
    });
  });
});
