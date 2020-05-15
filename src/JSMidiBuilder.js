/**
 * JSMidiActionBuilder is a class to build midi action objects
 * that can be chained together for less verbose live files.
 * We only expose the functions that can kick off a chain.
 *
 * @param {Object} action - the action opbject.
*/
class JSMidiActionBuilder {
  constructor (action = {}) {
    this.action = action;

    this.h = this.hold;
    this.a = this.after;
    this.v = this.velocity;
    this.d = this.dups;
  }

  /**
   * Sets the action's hold value.
   *
   * @param {Number} hold - the hold value.
   * @returns {JSMidiBuilder}
  */
  hold (hold) {
    Object.assign(this.action, { hold });
    return this;
  }

  /**
   * Sets the action's after value.
   *
   * @param {Number} after - the after value.
   * @returns {JSMidiBuilder}
  */
  after (after) {
    Object.assign(this.action, { after });
    return this;
  }

  /**
   * Sets the action's velocity value.
   *
   * @param {Number} velocity - the velocity value.
   * @returns {JSMidiBuilder}
  */
  velocity (velocity) {
    Object.assign(this.action, { velocity });
    return this;
  }

  /**
   * Allow duplicate notes.
   *
   * @returns {JSMidiBuilder}
  */
  dups () {
    Object.assign(this.action, { dups: true });
    return this;
  }
}

module.exports = {
  notes: (notes) => {
    return new JSMidiActionBuilder({ notes });
  },

  chord: (chord) => {
    return new JSMidiActionBuilder({ chord });
  },

  pause: (hold) => {
    return new JSMidiActionBuilder({ pause: true, hold });
  },

  sustain: (hold) => {
    return new JSMidiActionBuilder({ sustain: true, hold });
  }
};
