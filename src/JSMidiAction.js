const Tonal = require('@tonaljs/modules');

/**
 * JSMidiAction is a class to describe instrumental midid actions
 * like playing a chord, playing a series of notes or putting the
 * sustain on.
 *
 * @param {String} [type] - the action type.
 * @param {String} [chord] - the musical name of a chord.
 * @param {String|Array} [notes] - a single note or array of notes.
 * @param {Boolean} [dups] - allow duplicate actions.
 * @param {Number} [velocity] - the action's velocity.
 * @param {Number} [after] - how long to wait to execute an action.
 * @param {Number} [hold] - how long to hold an action for.
*/
module.exports = class JSMidiAction {
  constructor (props = {}) {
    const action = props.action
      ? props.action
      : props;

    Object.assign(this, {
      dups: false,
      velocity: 98,
      after: 0,
      hold: 0
    }, action);
  }

  /**
   * Gets an array of notes or an empty array
   * based on the action's type.
   *
   * @returns {Array} - an array of notes.
   */
  getNotes () {
    const { notes, chord } = this;

    if (notes) {
      return Array.isArray(notes) ? notes : [notes];
    }

    if (chord) {
      return Tonal.Chord.get(chord).notes;
    }

    return [];
  }

  /**
   * Gets an action's event options.
   *
   * @returns {Object} - an event options object.
   */
  getEventOptions () {
    return {
      dups: this.dups,
      velocity: this.velocity,
      after: this.after,
      hold: this.hold
    };
  }
};
