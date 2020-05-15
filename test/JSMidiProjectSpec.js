const { expect } = require('chai');
const { JSMidiProject, JSMidi } = require('../src');

const performance = { now: require('performance-now') };
global.navigator = require('web-midi-api');

describe('JSMidiProject', function () {
  let project = null;

  // This simulates getting the Web Midi API
  // and performance from the browser.
  before((done) => {
    navigator.requestMIDIAccess().then(function (midi) {
      project = new JSMidiProject(midi, performance);
      done();
    });
  });

  // We need to close the Midi access otherwise
  // it turns into a zombie node process.
  after(() => { navigator.close(); });

  describe('project', () => {
    describe('constructor()', () => {
      it('should initialize correctly', function () {
        expect(project.jsmidi).to.eq(JSMidi);
      });
    });
  });
});
