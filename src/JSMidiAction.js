const Tonal = require('@tonaljs/modules');

/**
 * JSMidiAction is a class to describe instrumental actions like playing a chord,
 * playing a series of notes or putting the sustain on. It accepts a plain
 * object or a builder object with the action property set.
 *
 * @param {Object|JSMidiBuilder} [props] - action
 * @param {String} [props.type] - action type
 * @param {String} [props.chord] - TonalJS chord name
 * @param {String|Array} [props.notes] - a single note or array of notes
 * @param {Number} [props.velocity] - action's velocity
 * @param {Number} [props.after] - how long to wait to execute an action
 * @param {Number} [props.hold] - how long to hold an action
*/
module.exports = class JSMidiAction {
  constructor (props) {
    const action = props.action
      ? props.action
      : props;

    Object.assign(this, {
      velocity: 98,
      after: 0,
      hold: 0
    }, action);
  }

  /**
   * Gets an array of notes or an empty array based on the action's type.
   *
   * @returns {Array} - an array of notes
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
   * @returns {Object} - an event options object
   */
  getEventOptions () {
    return {
      velocity: this.velocity,
      after: this.after,
      hold: this.hold
    };
  }
};
