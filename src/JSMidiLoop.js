const NanoTimer = require('nanotimer');
const Events = require('eventemitter2').EventEmitter2;
const JSMidiForm = require('./JSMidiForm');

/**
 * JSMidiLoop is the musical time keeper and scheduler. The loop
 * is broken down by position into parts, bars and beats based on the
 * JSMidiForm. It works its way through the each position scheduling future
 * MIDI events at each next position in the loop.
 *
 * @param {Number} [bars] - number of bars
 * @param {Number} [beats] - number of beats
 * @param {Array} [parts] - an array of parts made of bars and beats
 * @param {Boolean} [repeat] - whether to start over at the end of the loop
 * @param {Number} [offset] - number of miliseconds to wait before starting the loop
 * @param {Number} [maxRestarts] - max number of restarts allowed
 *
 * @property {Number} bar - current bar
 * @property {Number} beat - current beat
 * @property {Number} part - current part
 * @property {String} position - current position
 * @property {Boolean} playing - if the loop is "playing" or not
 * @property {Number} restarts - number of times the loop has restarted
 * @property {JSMidiForm} form - musical form of the loop/song
 * @property {NanoTimer} timer - used for setting timeouts
 * @property {EventEmitter2} events - used for emitting events
*/
module.exports = class JSMidiLoop {
  constructor ({
    bars = 4,
    beats = 16,
    parts = [],
    repeat = false,
    maxRestarts = 16
  } = {}) {
    this.bar = 1;
    this.beat = 1;
    this.part = 1;
    this.time = 0;
    this.bpm = 120;
    this.interval = 500;
    this.restarts = 0;
    this.playing = false;
    this.offset = 100;
    this.repeat = repeat;
    this.position = '1:1:1';
    this.maxRestarts = maxRestarts;
    this.timer = new NanoTimer();
    this.form = new JSMidiForm({ parts, bars, beats });
    this.events = new Events({ wildcard: true });
  }

  /**
   * Updates the loop's options and form.
   *
   * @param {Number} [time] - window's performance time
  */
  update ({
    bars, beats, parts,
    repeat = this.repeat,
    maxRestarts = this.maxRestarts
  } = {}) {
    this.repeat = repeat;
    this.maxRestarts = maxRestarts;
    this.form.update({ bars, beats, parts });
  }

  /**
   * Starts the loop at the window's performance time.
   *
   * @param {Number} [time] - window's performance time
  */
  start (time = 0) {
    if (this.playing === true) {
      return;
    }

    this.playing = true;
    this.time = time + this.offset;

    this._setStartPosition();
    this._scheduleStartPosition();
    this._advance();
  }

  /**
   * Stops the loop, sends off messages for any open notes or sustains on
   * each track and clears the timer.
  */
  stop () {
    if (this.playing === false) {
      return;
    }

    this.bar = 1;
    this.beat = 1;
    this.part = 1;
    this.restarts = 0;
    this.playing = false;
    this.position = '1:1:1';
    this.timer.clearTimeout();
    this.events.emit('stop');
  }

  /**
   * Restarts the loop. Note that this is not the same as restartPlayback in
   * the Atom plugin.
  */
  restart () {
    this.restarts += 1;
    this._setStartPosition();
    this._scheduleStartPosition();
    this._advance();
  }

  setTempo (bpm) {
    this.bpm = bpm;
    this.interval = (60 / bpm) * 1000;
  }

  /**
   * Turns repeat on.
  */
  enableRepeat () {
    this.repeat = true;
  }

  /**
   * Turns repeat off.
  */
  disableRepeat () {
    this.repeat = false;
  }

  /**
   * Repeat section tells the loop to focus on a specific section of the loop
   * by start and end position based on the form.
   *
   * @param {String} start - start position
   * @param {String} end - end position
  */
  focus (start, end) {
    this.form.updateBounds(start, end);
    this.enableRepeat();
  }

  /**
   * Resets the loop.
  */
  reset () {
    this.bar = 1;
    this.beat = 1;
    this.part = 1;
    this.restarts = 0;
    this.playing = false;
    this.repeat = false;
    this.position = '1:1:1';
    this.timer.clearTimeout();
    this.form.reset();
    this.setTempo(120);
  }

  // PRIVATE --------------------------------------------------------

  /**
   * Calculates and schedules the next position, incremets the position and
   * advances or restarts the loop.
   *
   * @private
  */
  _advance () {
    this.time += this.interval;

    if (this._shouldRestart()) {
      this._broadcastPosition();
      this.timer.setTimeout(() => {
        this.restart();
      }, '', `${this.interval}m`);
      return;
    }

    if (this._shouldStop()) {
      this.stop();
      return;
    }

    this._broadcastPosition();

    const nextPosition = this._getNextPosition();
    this._schedulePosition(nextPosition, this.time);

    this._incrementPosition();
    this.timer.setTimeout(() => {
      if (this.playing) {
        this._advance();
      }
    }, '', `${this.interval}m`);
  }

  /**
   * Sets current position of the loop as a string.
   *
   * @private
  */
  _setCurrentPosition () {
    this.position = [
      this.part,
      this.bar,
      this.beat
    ].join(':');
  }

  /**
   * Sets the starting position from the form.
   *
   * @private
  */
  _setStartPosition () {
    const sp = this.form.getFirstPosition();
    [this.part, this.bar, this.beat] = sp;
  }

  /**
   * Increments the position by beat, bar and part and sets the current position.
   *
   * @private
  */
  _incrementPosition () {
    this.beat += 1;

    if (this.form.hasParts()) {
      const part = this.form.getPart(this.part);
      if (this.beat > part.beats) {
        this.beat = 1;
        this.bar += 1;
        if (this.bar > part.bars) {
          this.bar = 1;
          this.part += 1;
        }
      }
    } else {
      if (this.beat > this.form.beats) {
        this.beat = 1;
        if (this.form.bars) {
          this.bar += 1;
        }
      }
    }

    this._setCurrentPosition();
  }

  /**
   * Broadcasts the current position to listeners.
   *
   * @private
  */
  _broadcastPosition () {
    this.events.emit('position', this.position);
  }

  /**
   * Broadcasts the current position to listeners.
   *
   * @param {String} position - loop position
   * @param {Number} time - performance time
   * @private
  */
  _schedulePosition (position, time) {
    this.events.emit('schedule-position', position, time);
  }

  /**
   * Sets and schedules the starting position of the loop.
   *
   * @private
  */
  _scheduleStartPosition () {
    this._setCurrentPosition();
    this._schedulePosition(this.position, this.time);
  }

  /**
   * Gets the next position in the loop even past the defined bounds.
   *
   * @retuns {String}
   * @private
  */
  _getNextPosition () {
    const nextBar = this.bar + 1;
    const nextBeat = this.beat + 1;

    if (this.form.hasParts()) {
      const part = this.form.getPart(this.part);
      if (nextBeat > part.beats) {
        if (nextBar > part.bars) {
          return `${this.part + 1}:1:1`;
        }
        return `${this.part}:${nextBar}:1`;
      }
    } else {
      if (nextBeat > this.form.beats) {
        if (nextBar > this.form.bars) {
          return `${this.part}:${nextBar}:1`;
        }
        return `${this.part}:${nextBar}:1`;
      }
    }

    return `${this.part}:${this.bar}:${nextBeat}`;
  }

  /**
   * Determines if the loop should restart and incremets the restart count.
   *
   * @retuns {Booolean}
   * @private
  */
  _shouldRestart () {
    if (this.repeat === false) {
      return false;
    }

    if (this.restarts >= this.maxRestarts) {
      return false;
    }

    const [part, bar, beat] = this.form.getLastPosition();
    if (this.beat === beat && this.bar === bar && this.part === part) {
      return true;
    }

    return false;
  }

  /**
   * Determines if the loop should stop.
   *
   * @retuns {Booolean}
   * @private
  */
  _shouldStop () {
    if (this.repeat === true && this.restarts >= this.maxRestarts) {
      return true;
    }

    const [part, bar] = this.form.getLastPosition();
    return this.bar > bar || this.part > part;
  }
};
