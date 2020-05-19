/**
 * JSMidiForm represents the musical form of a song or project.
 * The musical form is broken down into parts, bars and beats which
 * determines the path of the loop.
 *
 * @param {Number} [bars] - the number of bars.
 * @param {Number} [beats] - the number of beats.
 * @param {Array} [parts] - an array of parts made of bars and beats.
 *
 * @property {Array} bounds - the upper and lower bounds of the form.
*/
module.exports = class JSMidiForm {
  constructor ({
    bars = 4,
    beats = 16,
    parts = []
  } = {}) {
    this.bars = bars;
    this.beats = beats;
    this.parts = parts;
    this.bounds = [];

    this.setBounds();
  }

  /**
   * Reset/update the form and reset the bounds.
  */
  reset ({
    bars = 4,
    beats = 16,
    parts = []
  } = {}) {
    this.bars = bars;
    this.beats = beats;
    this.parts = parts;
    this.setBounds();
  }

  /**
   * Updates the upper and lower bounds. Used to focus/repeat
   * a section of the loop.
   *
   * @param {String} start - the start position (lower bounds).
   * @param {String} end - the end position (upper bounds).
   *
   * @throws Error 'Invalid bounds: <<start>> - <<end>>'
  */
  updateBounds (start, end) {
    const sp = start.split(':').map(i => parseInt(i));
    const ep = end.split(':').map(i => parseInt(i));

    if (sp[0] > ep[0] || sp[1] > ep[1] || sp[2] > ep[2]) {
      throw new Error(`Invalid bounds: ${start} - ${end}`);
    }

    this.bounds = [sp, ep];
  }

  /**
   * Sets the upper and lower bounds.
  */
  setBounds () {
    this.setLowerBounds();
    this.setUpperBounds();
  }

  /**
   * Sets the lower bounds.
  */
  setLowerBounds () {
    this.bounds[0] = [1, 1, 1];
  }

  /**
   * Sets the upper bounds.
  */
  setUpperBounds () {
    if (this.hasParts()) {
      const lp = this.getLastPart();
      this.bounds[1] = [this.parts.length, lp.bars, lp.beats];
      return;
    }

    this.bounds[1] = [1, this.bars, this.beats];
  }

  /**
   * Gets the first position.
   *
   * @retuns {Array}
  */
  getFirstPosition () {
    return this.bounds[0];
  }

  /**
   * Gets the last position.
   *
   * @retuns {Array}
  */
  getLastPosition () {
    return this.bounds[1];
  }

  /**
   * Gets a part. Since the array is zero based
   * we subtrack one from the part requested.
   *
   * @param {Number} part - the part.
   * @retuns {Object}
  */
  getPart (part) {
    return this.parts[Number(part) - 1];
  }

  /**
   * Gets the first part.
   *
   * @retuns {Object}
  */
  getFirstPart () {
    return this.parts[0];
  }

  /**
   * Gets the last part.
   *
   * @retuns {Object}
  */
  getLastPart () {
    return this.parts[this.parts.length - 1];
  }

  /**
   * Determines if the loop has parts or not.
   * @private
   *
   * @retuns {Booolean}
  */
  hasParts () {
    return this.parts.length > 0;
  }
};
