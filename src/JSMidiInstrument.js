const Tonal = require('@tonaljs/modules');
const JSMidiEvent = require('./JSMidiEvent');
const JSMidiAction = require('./JSMidiAction');
const JSMidiPosition = require('./JSMidiPosition');
const JSMidi = require('./JSMidi');

/**
 * JSMidiInstrument is how we define and interact with virtual instruments in Logic
 * Pro, Ableton, Garage Band, etc.
 *
 * @param {String} name - name of the instrument
 * @param {Object} opts - options object
 * @param {Number} [opts.channel] - MIDI channel of the instrument
 * @param {Boolean} [opts.muted] - instrument's muted state.
 *
 * @property {Object} events - MIDI events by position
 * @property {Object} tracking - event tracking by position
 * @property {Object} rests - positions where the instrument should rest
*/
module.exports = class JSMidiInstrument {
  constructor (name, opts = {}) {
    this.name = name;
    this.events = {};
    this.tracking = {};
    this.rests = {};

    Object.assign(this, {
      channel: 0,
      muted: false
    }, opts);
  }

  /**
   * Play any number of notes at position.
   *
   * @param {String} position - loop position
   * @param {JSMidiBuilder|Object} props - action properties
  */
  play (position, props) {
    const action = new JSMidiAction(props);
    this.notesOn(position, action);
  }

  /**
   * Stop any number of notes at position.
   *
   * @param {String} position - loop position
   * @param {JSMidiBuilder|Object} props - action properties
  */
  stop (position, props) {
    const action = new JSMidiAction(props);
    this.notesOff(position, action);
  }

  /**
   * Take any number of actions at position. When live coding it is less verbose
   * than play for multiple actions.
   *
   * @param {String} position - loop position
   * @param {Array} actions - an array of actions
  */
  at (position, actions) {
    actions.forEach(props => {
      const action = new JSMidiAction(props);

      if (action.notes || action.chord) {
        this.notesOn(position, action);
      }

      if (action.sustain) {
        const opts = action.getEventOptions();
        this.sustainOn(position, opts);
      }
    });
  }

  /**
   * Sequences a pattern for a single note. Primarily used for making drum
   * sequences easy. In the pattern values less than zero will be treated
   * as a rest.
   *
   * @param {String} position - loop position
   * @param {JSMidiBuilder|Object} props - action properties
   * @param {Array} pattern - pattern of holds and rests
   *
   * @throws Error After not allowed in pattern.
  */
  pattern (position, action, pattern) {
    if (action.after !== undefined) {
      throw new Error('After not allowed in pattern.');
    }

    const actions = pattern.map(hold => {
      if (hold <= 0) {
        return { rest: true, hold: Math.abs(hold) };
      }
      return Object.assign({ hold }, action);
    });

    this.sequence(position, actions);
  }

  /**
   * Adds an ordered sequence of events to the event queue. Each action
   * requires a hold time so it can calculate when to take the next action
   * in the sequence.
   *
   * @param {String} position - loop position
   * @param {Array} actions - an array of actions
   *
   * @throws Error 'Wildcard "*" not allowed for beats in sequence.'
  */
  sequence (position, actions) {
    const pos = new JSMidiPosition(position);

    if (pos.beats === '*') {
      throw new Error('Wildcard "*" not allowed for beats in sequence.');
    }

    pos.parts.split(',').forEach(part => {
      pos.bars.split(',').forEach(bar => {
        pos.beats.split(',').forEach(bt => {
          let after = 0;
          let beat = Number(bt);
          let previous;

          actions.forEach((props, idx) => {
            const action = new JSMidiAction(props);

            if (idx === 0) {
              // With no previous action we just look for after
              // greater than 1 and increment the beat accordingly.
              if (action.after >= 1) {
                beat += Math.floor(action.after);
                after = action.after - Math.floor(action.after);
              }
            } else {
              // With a previous action we set the after count to
              // the current after plus the previous hold. Then based on
              // that value with increment the beat accordingly.
              after += action.after + previous.hold;
              if (after >= 1) {
                beat += Math.floor(after);
                after = after - Math.floor(after);
              }
            }

            Object.assign(action, { after });

            // Only send notes on.
            if (action.notes || action.chord) {
              this.notesOn(`${part}:${bar}:${Math.floor(beat)}`, action);
            }

            previous = action;
          });
        });
      });
    });
  }

  /**
   * Adds a midi "noteon" event to the events object.
   *
   * @param {String} position - loop position
   * @param {String} note - name of the note
   * @param {Object} options - event options
  */
  noteOn (position, note, opts = {}) {
    const data = Tonal.Midi.toMidi(note);

    const { velocity, after, hold } = opts;
    const event = new JSMidiEvent('noteon', this.channel, {
      data, velocity, after, hold
    });

    this._stageEvent(position, event);
  }

  /**
   * Adds a midi "noteoff" event to the events object.
   *
   * @param {String} position - loop position
   * @param {String} note - name of the note
   * @param {Object} options - event options
  */
  noteOff (position, note, opts = {}) {
    const data = Tonal.Midi.toMidi(note);

    const event = new JSMidiEvent('noteoff', this.channel, {
      data, velocity: 0, after: opts.after
    });

    this._stageEvent(position, event);
  }

  /**
   * Adds a midi "sustainon" event to the events object.
   *
   * @param {String} position - loop position
   * @param {Object} options - event options
  */
  sustainOn (position, opts) {
    const { hold, after } = opts;

    const event = new JSMidiEvent('sustainon', this.channel, {
      after, hold, data: 64, velocity: 127
    });

    this._stageEvent(position, event);
  }

  /**
   * Adds a midi "sustainoff" event to the events object.
   *
   * @param {String} position - loop position
   * @param {Object} options - event options
  */
  sustainOff (position, opts = {}) {
    const event = new JSMidiEvent('sustainoff', this.channel, {
      data: 64, velocity: 0, after: opts.after
    });

    this._stageEvent(position, event);
  }

  /**
   * Adds "noteon" events for an action.
   *
   * @param {String} position - loop position
   * @param {JSMidiAction} action - action object
  */
  notesOn (position, action) {
    const opts = action.getEventOptions();
    action.getNotes().forEach(note => {
      this.noteOn(position, note, opts);
    });
  }

  /**
   * Adds "noteoff" events for an action.
   *
   * @param {String} position - loop position
   * @param {JSMidiAction} action - action object
  */
  notesOff (position, action) {
    const opts = action.getEventOptions();
    action.getNotes().forEach(note => {
      this.noteOff(position, note, opts);
    });
  }

  /**
   * Adds rest positions within the provided range.
   *
   * @param {String} start - start position
   * @param {String} end - end position
   *
   * @throws Error 'Invalid starting position: <<start>>.'
   * @throws Error 'Invalid ending position: <<end>>.'
   * @throws Error 'Invalid range: <<start>> - <<end>>.'
  */
  rest (start, end) {
    const { form } = JSMidi.loop;
    const sp = start.split(':').map(i => Number(i));
    const ep = end.split(':').map(i => Number(i));

    [0, 1, 2].forEach(i => {
      if (Number.isNaN(sp[i])) {
        throw new Error(`Invalid starting position: ${start}.`);
      }

      if (Number.isNaN(ep[i])) {
        throw new Error(`Invalid ending position: ${end}.`);
      }
    });

    if (
      (sp[0] > ep[0]) ||
      (sp[0] === ep[0] && sp[1] > ep[1]) ||
      (sp[0] === ep[0] && sp[1] === ep[1] && sp[2] > ep[2])
    ) {
      throw new Error(`Invalid range: ${start} - ${end}.`);
    }

    // Set the starting position.
    let [part, bar, beat] = sp;

    // Advance the beat basically the same way we do
    // in the loop. If we reach the end position or
    // the form's upper bounds, we stop.
    const advance = () => {
      const pos = [part, bar, beat].join(':');

      this.rests[pos] = true;

      if (
        pos === end ||
        pos === form.bounds[1].join(':')
      ) {
        return;
      }

      beat += 1;
      if (beat > form.beats) {
        beat = 1;
        bar += 1;
        advance();
        if (bar > form.bars) {
          bar = 1;
          part += 1;
          advance();
        }
      } else {
        advance();
      }
    };

    advance();
  }

  /**
   * Determines if the instrument should rest at position.
   *
   * @param {String} position - loop position
   * @returns {Boolean}
  */
  shouldRest (position) {
    return this.rests[position] === true;
  }

  /**
   * Mutes the instrument.
  */
  mute () {
    this.muted = true;
  }

  /**
   * Unmutes the instrument.
  */
  unmute () {
    this.muted = false;
  }

  /**
   * Resets the instrument to its inital state. When live coding, if changes
   * are made to the Live file we need to reset the events and tracking so
   * changes are reflected.
  */
  reset () {
    this.muted = false;
    this.events = {};
    this.tracking = {};
    this.rests = {};
  }

  // PRIVATE --------------------------------------------------------

  /**
   * Stages an event in the events object and tracks those events by position.
   * If an event has already been added or duplicates are not allowed (default)
   * we ignore the event.
   *
   * @param {String} position - loop position
   * @param {JSMidiEvent} event - MIDI event
   * @private
  */
  _stageEvent (position, event) {
    const { parts, bars, beats } = new JSMidiPosition(position);
    parts.split(',').forEach(part => {
      bars.split(',').forEach(bar => {
        beats.split(',').forEach(beat => {
          const pos = `${part}:${bar}:${beat}`;

          if (this.events[pos]) {
            this.events[pos].push(event);
          } else {
            this.events[pos] = [event];
          }
        });
      });
    });
  }
};
