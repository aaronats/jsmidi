/**
 * JSMidiForm represents the musical form or structure of a song. The musical form
 * is broken down into parts, bars and beats which determines the path of the loop.
 *
 * @param {Number} [bars] - number of bars
 * @param {Number} [beats] - number of beats
 * @param {Array} [parts] - array of parts made of bars and beats
 *
 * @property {Array} bounds - upper and lower bounds of the form
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

    this._setBounds();
  }

  /**
   * Update the form and set the bounds.
   *
   * @param {Object} opts
   * @param {Number} opts.bars - number of bars
   * @param {Number} opts.beats - number of beats
   * @param {Array} opts.parts - array of parts
  */
  update ({
    bars = 4,
    beats = 16,
    parts = []
  } = {}) {
    this.bars = bars;
    this.beats = beats;
    this.parts = parts;
    this._setBounds();
  }

  /**
   * Reset the form and reset the bounds.
  */
  reset () {
    this.bars = 4;
    this.beats = 16;
    this.parts = [];
    this._setBounds();
  }

  /**
   * Updates the upper and lower bounds. Used to focus/repeat a section of
   * the loop.
   *
   * @param {String} start - start position (lower bounds)
   * @param {String} end - end position (upper bounds)
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
   * Gets a part. Since the array is zero based we subtrack one from the
   * part requested.
   *
   * @param {Number} part - part number
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
   *
   * @retuns {Booolean}
  */
  hasParts () {
    return this.parts.length > 0;
  }

  // PRIVATE --------------------------------------------------------

  /**
   * Sets the upper and lower bounds.
   *
   * @private
  */
  _setBounds () {
    this._setLowerBounds();
    this._setUpperBounds();
  }

  /**
   * Sets the lower bounds.
   *
   * @private
  */
  _setLowerBounds () {
    this.bounds[0] = [1, 1, 1];
  }

  /**
   * Sets the upper bounds.
   *
   * @private
  */
  _setUpperBounds () {
    if (this.hasParts()) {
      const lp = this.getLastPart();
      this.bounds[1] = [this.parts.length, lp.bars, lp.beats];
      return;
    }

    this.bounds[1] = [1, this.bars, this.beats];
  }
};
