const JSMidi = require('./JSMidi');

/**
 * JSMidiPosition is a class to expand a position's bars
 * and beats. Parts are not expanded.
 *
 * @param {String} position - the position.
 *
 * @property {String} bars - expanded bars.
 * @property {String} beats - expanded beats.
 * @property {String} parts - parts as is.
*/
module.exports = class JSMidiPosition {
  constructor (position) {
    this.position = position;

    this.bars = null;
    this.beats = null;
    this.parts = null;

    this._expand();
  }

  /**
   * Parses and expands the position into parts, bars and beats.
   *
   * @private
   */
  _expand () {
    const { form } = JSMidi.loop;
    const pos = this.position.split(':');

    if (form.hasParts() && pos[0] === '*') {
      pos[0] = form.parts.map((a, i) => i + 1).join(',');
    }

    ['bars', 'beats'].forEach((name, i) => {
      const item = pos[i + 1];
      const part = form.getPart(pos[0]);

      if (item[0] === '@') {
        const nth = Number(item.split('@')[1]);
        const length = part ? part[name] : form[name];
        const arr = Array(length).fill(0).map((n, i) => i + 1);

        if (part && part[name] === 1) {
          pos[i + 1] = 0;
        } else {
          pos[i + 1] = this._every(nth, arr);
        }
      }
    });

    [this.parts, this.bars, this.beats] = pos;
  }

  /**
   * Returns joined array of positions using the @n method.
   *
   * @returns {String}
   * @private
   */
  _every (nth, arr) {
    // if nth is 1, get every odd value
    if (nth === 1) {
      return arr.filter(i => { return i % 2 === 1; }).join(',');
    }

    return arr.filter(i => { return i % nth === 0; }).join(',');
  }
};
