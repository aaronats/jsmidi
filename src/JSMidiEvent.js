/**
 * Supported midi events and their corresponding codes.
*/
const MIDI_CHANNEL_EVENTS = {
  noteon: 144,
  noteoff: 128,
  sustainon: 176,
  sustainoff: 176
};

/**
 * JSMidiEvent is a Midi event, like "noteon", with additional
 * values like hold and after that affect timing.
 *
 * @param {String} type - the type of midi event.
 * @param {Number} channel - the midi channel.
 * @param {Number} data - the midi data value.
 * @param {Number} [velocity] - the midi event velocity.
 * @param {Number} [after] - how long to wait before executing the event.
 * @param {Number} [hold] - how long to hold the event.
*/
module.exports = class JSMidiEvent {
  constructor (type, channel = 0, opts = {}) {
    this.type = type;
    this.channel = Number(channel);

    if (!MIDI_CHANNEL_EVENTS[this.type]) {
      throw new Error(`Midi event ${this.type} is not supported.`);
    }

    Object.assign(this, {
      data: 0,
      velocity: 98,
      after: 0,
      hold: 0
    }, opts);
  }

  /**
   * Returns a Midi message in Web Midi API send format.
   *
   * @retuns {Array} - Web Midi API send formated message.
  */
  message () {
    const event = MIDI_CHANNEL_EVENTS[this.type] + this.channel;
    return [event, Number(this.data), Number(this.velocity)];
  }

  /**
   * Returns an off event for noteon and sustainon events.
   *
   * @retuns {JSMidiEvent}
  */
  offEvent () {
    if (this.isOnEvent()) {
      const { type, channel, data } = this;

      if (type === 'noteon') {
        return new JSMidiEvent('noteoff', channel, { data });
      }

      if (type === 'sustainon') {
        return new JSMidiEvent('sustainoff', channel, { data: 64 });
      }
    }
  }

  /**
   * Calculates in miliseconds how long to hold the event.
   *
   * @param {JSMidiLoop} loop
   * @retuns {Number}
  */
  calculateHold (loop) {
    if (this.hold <= loop.form.beats) {
      return (loop.interval * this.hold);
    }
    return this.hold;
  }

  /**
   * Calculates in miliseconds how long to wait before
   * sending the event.
   *
   * @param {JSMidiLoop} loop
   * @retuns {Number}
  */
  calculateAfter (loop) {
    if (this.after > 0) {
      if (this.after <= loop.form.beats) {
        return loop.interval * this.after;
      }
      return loop.interval + this.after;
    }
    return this.after;
  }

  /**
   * Determines if the event has a hold duration.
   *
   * @retuns {Boolean}
  */
  hasDuration () {
    return this.hold > 0;
  }

  /**
   * Determines if the event is an "on" event.
   *
   * @retuns {Boolean}
  */
  isOnEvent () {
    return ['noteon', 'sustainon'].includes(this.type);
  }

  /**
   * Determines if the event is an "off" event.
   *
   * @retuns {Boolean}
  */
  isOffEvent () {
    return ['noteoff', 'sustainoff'].includes(this.type);
  }

  /**
   * Builds a string key based on the channel, type and
   * data properties for tracking if an event is already
   * on or off.
   *
   * @retuns {String}
  */
  trackingKey () {
    const { channel, type, data } = this;

    if (this.isOnEvent()) {
      return `${channel}|${type}|${data}`;
    }

    if (type === 'noteoff') {
      return `${channel}|noteon|${data}`;
    }

    if (type === 'sustainoff') {
      return `${channel}|sustainon|${data}`;
    }
  }

  /**
   * Builds a string key based on a position, type and
   * data properties for tracking if an event has already
   * been added to the  JSMidiInstrument events object.
   *
   * @retuns {String}
  */
  positionKey (pos) {
    return `${pos}|${this.type}|${this.data}`;
  }
};
