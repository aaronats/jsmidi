/**
 * JSMidiIO is the main midi I/O controller. It is esentially
 * a wrapper for WebMidi.
 *
 * @property {Object} webmidi - the WebMidi instance.
 * @property {Object} output - the selected webmidi output.
 * @property {Object} input - the selected webmidi input.
*/
module.exports = class JSMidiIO {
  constructor () {
    this.inputs = [];
    this.outputs = [];

    this.time = null;
    this.midi = null;
    this.output = null;
    this.input = null;
  }

  /**
   * Sets up the Web Midi API, performance time and sets
   * the default input and output.
   *
   * @param {Object} midi - the Web Midi API instance.
   * @param {Object} time - the window's performance time object.
   */
  setup (midi, time) {
    if (!midi) {
      throw new Error('Web Midi API not enabled.');
    }

    this.midi = midi;
    this.time = time;
    this.setOutput();
    this.setInput();
  }

  /**
   * Set the Midi input from the available WebMidi inputs.
   *
   * @param {Number} [idx] - index of the WebMidi input desired.
   */
  setInput (idx = 0) {
    this.inputs = Array.from(this.midi.inputs.values());

    if (this.inputs.length === 0) {
      return console.warn('No Midi inputs available.');
    }

    this.input = this.inputs[idx];
  }

  /**
   * Set the Midi output from the available WebMidi outputs.
   *
   * @param {Number} [idx] - index of the WebMidi output desired.
   */
  setOutput (idx = 0) {
    this.outputs = Array.from(this.midi.outputs.values());

    if (this.outputs.length === 0) {
      return console.warn('No Midi outputs available.');
    }

    this.output = this.outputs[idx];
  }

  /**
   * Returns the window's performance time. Used for accurately
   * scheduling events. Zero can be used for testing when
   * performance time is not available.
   *
   * @returns {Number}
   */
  now () {
    return this.time ? this.time.now() : 0;
  }
};
