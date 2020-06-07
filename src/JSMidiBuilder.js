/**
 * JSMidiBuilder is a class to build action objects that can be chained together
 * for less verbose syntax. We only expose functions that can kick off a chain.
 *
 * @param {Object} action - action object
 * @namespace JSMidiBuilder
*/
class JSMidiBuilder {
  constructor (action = {}) {
    this.action = action;

    // Aliases.
    this.h = this.hold;
    this.a = this.after;
    this.v = this.velocity;
  }

  /**
   * Sets the action's hold value.
   *
   * @param {Number} hold - hold value
   * @returns {JSMidiBuilder}
  */
  hold (hold) {
    Object.assign(this.action, { hold });
    return this;
  }

  /**
   * Sets the action's after value.
   *
   * @param {Number} after - after value
   * @returns {JSMidiBuilder}
  */
  after (after) {
    Object.assign(this.action, { after });
    return this;
  }

  /**
   * Sets the action's velocity value.
   *
   * @param {Number} velocity - velocity value
   * @returns {JSMidiBuilder}
  */
  velocity (velocity) {
    Object.assign(this.action, { velocity });
    return this;
  }
}

module.exports = {
  /**
   * Sets the action's notes value.
   *
   * @param {String|Array} notes - a single note or array of notes
   * @returns {JSMidiBuilder}
  */
  notes: (notes) => {
    return new JSMidiBuilder({ notes });
  },

  /**
   * Sets the action's chord value.
   *
   * @param {String} chord - TonalJS chord name
   * @returns {JSMidiBuilder}
  */
  chord: (chord) => {
    return new JSMidiBuilder({ chord });
  },

  /**
   * Sets the action's rest value.
   *
   * @param {Number} hold - how long to hold the rest
   * @returns {JSMidiBuilder}
  */
  rest: (hold) => {
    return new JSMidiBuilder({ rest: true, hold });
  },

  /**
   * Sets the action's sustain value.
   *
   * @param {Number} hold - how long to hold the sustain
   * @returns {JSMidiBuilder}
  */
  sustain: (hold) => {
    return new JSMidiBuilder({ sustain: true, hold });
  }
};
