const JSMidiIO = require('./JSMidiIO');
const JSMidiLoop = require('./JSMidiLoop');
const JSMidiEvent = require('./JSMidiEvent');
const JSMidiBuilder = require('./JSMidiBuilder');

/**
 * JSMidi is a singleton class that provides the shared state and interface
 * we need to schedule midi events, manage tracks, control the loop and set
 * musical form/timing.
 *
 * @property {Object} tracks - object to store instruments by name.
 * @property {Object} events - midi event tracking object.
 * @property {JSMidiIO} io - midi I/O controller via WebMidi.
 * @property {JSMidiLoop} loop - the main and only loop.
 * @property {JSMidiBuilder} builder - action builder.
 * @namespace JSMidi
 *
*/
class JSMidi {
  constructor () {
    this.tracks = {};
    this.events = {};
    this.io = new JSMidiIO();
    this.loop = new JSMidiLoop();
    this.builder = JSMidiBuilder;

    this.addEventListeners();
  }

  /**
   * Sets up the Web Midi API and the performance time once it is available
   * and enabled from the Atom browser.
   *
   * @param {Object} midi - the Web Midi API instance.
   * @param {Object} time - the browser's performance time.
   */
  setup (midi, time) {
    this.io.setup(midi, time);
  }

  /**
   * Adds event listeners for position scheduling and loop
   * stop events.
   */
  addEventListeners () {
    this.loop.events.on('schedule-position', (position, time) => {
      this.schedule(position, time);
    });

    this.loop.events.on('stop', () => {
      this.allOff();
    });
  }

  /**
   * Adds a JSMidiInstrument to the tracks object by name.
   *
   * @param {JSMidiInstrument} instrument
   */
  addTrack (instrument) {
    this.tracks[instrument.name] = instrument;
  }

  /**
   * Removes a JSMidiInstrument from the tracks object by name.
   *
   * @param {JSMidiInstrument} instrument
   */
  removeTrack (instrument) {
    delete this.tracks[instrument.name];
  }

  /**
   * Resets each instrument by track.
   */
  resetTracks () {
    Object.entries(this.tracks).forEach(([name, instrument]) => {
      instrument.reset();
    });
  }

  /**
   * Schedule midi events by position at performance time.
   *
   * @param {String} position - the form position.
   * @param {Number} time - performance time to execute the event.
   */
  schedule (position, time) {
    const [part, bar, beat] = position.split(':');

    // all possible positions
    const positions = [
      '*:*:*',
      `${part}:*:*`,
      `${part}:${bar}:*`,
      `${part}:*:${beat}`,
      `${part}:${bar}:${beat}`,
      `*:${bar}:${beat}`,
      `*:*:${beat}`
    ];

    Object.entries(this.tracks).forEach(([name, instrument]) => {
      if (instrument.muted || instrument.shouldRest(position)) {
        return;
      }

      // We loop through the possible positions because
      // they will generally be shorter than the instrument's
      // event keys (positions). If performance were an issue we
      // could compare lengths and run the shorter route.
      positions.forEach(pos => {
        if (instrument.events[pos]) {
          instrument.events[pos].forEach(event => {
            this.scheduleEvent(event, time);
          });
        }
      });
    });
  }

  /**
   * Schedule off messages for any outstanding notes
   * or sustains in the scheduled events object.
   */
  allOff () {
    Object.keys(this.events).forEach(key => {
      const [channel, type, data] = key.split('|');

      if (type === 'noteon') {
        this.scheduleEvent(
          new JSMidiEvent('noteoff', channel, { data })
        );
      }

      if (type === 'sustainon') {
        this.scheduleEvent(
          new JSMidiEvent('sustainoff', channel, { data: 64 })
        );
      }
    });
  }

  /**
   * Send off messages for all notes and sustains for
   * each instrument.
   *
   * TODO: need to test this!
   */
  fullReset () {
    Object.entries(this.tracks).forEach(([name, instrument]) => {
      const notes = new Array(109 - 36).fill().map((d, i) => i + 36);

      // notes off
      notes.forEach(note => {
        this.scheduleEvent(
          new JSMidiEvent('noteoff', instrument.channel, { data: note })
        );
      });

      // sustain off
      this.scheduleEvent(
        new JSMidiEvent('sustainoff', instrument.channel, { data: 64 })
      );
    });
  }

  /**
   * Reset tracks, events and loop.
   */
  reset () {
    ['tracks', 'events'].forEach(item => {
      Object.keys(this[item]).forEach(key => {
        // JSMidi is a singleton so we delete
        // by key since we can't overwrite.
        delete this[item][key];
      });
    });
    this.loop.reset();
  }

  /**
   * Schedule an individual midi event at time.
   *
   * @param {JSMidiEvent} event - an event object.
   * @param {Number} [time] - performance time.
   */
  scheduleEvent (event, time = 0) {
    const key = event.trackingKey();

    const after = event.calculateAfter(this.loop);
    if (this.io.output) {
      this.io.output.send(event.message(), time + after);
    }

    if (event.isOffEvent()) {
      delete this.events[key];
      return;
    }

    // Check for already scheduled events
    // and schedule an off event 10ms before.
    if (this.events[key]) {
      this.scheduleEvent(event.offEvent(), time - 10);
    }

    // Track after we check
    // for already scheduled.
    this.events[key] = true;

    // Schedule off events.
    if (event.hasDuration()) {
      const hold = event.calculateHold(this.loop);
      this.scheduleEvent(event.offEvent(), time + after + hold);
    }
  }
}

const instance = new JSMidi();
module.exports = Object.freeze(instance);
