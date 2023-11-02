/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 277:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}


/***/ }),

/***/ 399:
/***/ ((module) => {

"use strict";


var has = Object.prototype.hasOwnProperty
  , prefix = '~';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
  Events.prototype = Object.create(null);

  //
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  //
  if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Add a listener for a given event.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} once Specify if the listener is a one-time listener.
 * @returns {EventEmitter}
 * @private
 */
function addListener(emitter, event, fn, context, once) {
  if (typeof fn !== 'function') {
    throw new TypeError('The listener must be a function');
  }

  var listener = new EE(fn, context || emitter, once)
    , evt = prefix ? prefix + event : event;

  if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
  else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
  else emitter._events[evt] = [emitter._events[evt], listener];

  return emitter;
}

/**
 * Clear event by name.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} evt The Event name.
 * @private
 */
function clearEvent(emitter, evt) {
  if (--emitter._eventsCount === 0) emitter._events = new Events();
  else delete emitter._events[evt];
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @public
 */
function EventEmitter() {
  this._events = new Events();
  this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var names = []
    , events
    , name;

  if (this._eventsCount === 0) return names;

  for (name in (events = this._events)) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Array} The registered listeners.
 * @public
 */
EventEmitter.prototype.listeners = function listeners(event) {
  var evt = prefix ? prefix + event : event
    , handlers = this._events[evt];

  if (!handlers) return [];
  if (handlers.fn) return [handlers.fn];

  for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
    ee[i] = handlers[i].fn;
  }

  return ee;
};

/**
 * Return the number of listeners listening to a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Number} The number of listeners.
 * @public
 */
EventEmitter.prototype.listenerCount = function listenerCount(event) {
  var evt = prefix ? prefix + event : event
    , listeners = this._events[evt];

  if (!listeners) return 0;
  if (listeners.fn) return 1;
  return listeners.length;
};

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if (listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Add a listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  return addListener(this, event, fn, context, false);
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  return addListener(this, event, fn, context, true);
};

/**
 * Remove the listeners of a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {*} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return this;
  if (!fn) {
    clearEvent(this, evt);
    return this;
  }

  var listeners = this._events[evt];

  if (listeners.fn) {
    if (
      listeners.fn === fn &&
      (!once || listeners.once) &&
      (!context || listeners.context === context)
    ) {
      clearEvent(this, evt);
    }
  } else {
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
        listeners[i].fn !== fn ||
        (once && !listeners[i].once) ||
        (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else clearEvent(this, evt);
  }

  return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {(String|Symbol)} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;

  if (event) {
    evt = prefix ? prefix + event : event;
    if (this._events[evt]) clearEvent(this, evt);
  } else {
    this._events = new Events();
    this._eventsCount = 0;
  }

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Allow `EventEmitter` to be imported as module namespace.
//
EventEmitter.EventEmitter = EventEmitter;

//
// Expose the module.
//
if (true) {
  module.exports = EventEmitter;
}


/***/ }),

/***/ 531:
/***/ ((module) => {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



var R = typeof Reflect === 'object' ? Reflect : null
var ReflectApply = R && typeof R.apply === 'function'
  ? R.apply
  : function ReflectApply(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
  }

var ReflectOwnKeys
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target)
      .concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
}

function EventEmitter() {
  EventEmitter.init.call(this);
}
module.exports = EventEmitter;
module.exports.once = once;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

function checkListener(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
}

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }
    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function() {

  if (this._events === undefined ||
      this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};

function _getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = (type === 'error');

  var events = this._events;
  if (events !== undefined)
    doError = (doError && events.error === undefined);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    }
    // At least give some kind of context to the user
    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];

  if (handler === undefined)
    return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  checkListener(listener);

  events = target._events;
  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
        prepend ? [listener, existing] : [existing, listener];
      // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    // Check for listener leak
    m = _getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      var w = new Error('Possible EventEmitter memory leak detected. ' +
                          existing.length + ' ' + String(type) + ' listeners ' +
                          'added. Use emitter.setMaxListeners() to ' +
                          'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    if (arguments.length === 0)
      return this.listener.call(this.target);
    return this.listener.apply(this.target, arguments);
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      checkListener(listener);
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      checkListener(listener);

      events = this._events;
      if (events === undefined)
        return this;

      list = events[type];
      if (list === undefined)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener !== undefined)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (events === undefined)
        return this;

      // not listening for removeListener, no need to emit
      if (events.removeListener === undefined) {
        if (arguments.length === 0) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== undefined) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = Object.create(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners !== undefined) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (events === undefined)
    return [];

  var evlistener = events[type];
  if (evlistener === undefined)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ?
    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function once(emitter, name) {
  return new Promise(function (resolve, reject) {
    function errorListener(err) {
      emitter.removeListener(name, resolver);
      reject(err);
    }

    function resolver() {
      if (typeof emitter.removeListener === 'function') {
        emitter.removeListener('error', errorListener);
      }
      resolve([].slice.call(arguments));
    };

    eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
    if (name !== 'error') {
      addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
    }
  });
}

function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
  if (typeof emitter.on === 'function') {
    eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
  }
}

function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
  if (typeof emitter.on === 'function') {
    if (flags.once) {
      emitter.once(name, listener);
    } else {
      emitter.on(name, listener);
    }
  } else if (typeof emitter.addEventListener === 'function') {
    // EventTarget does not have `error` event semantics like Node
    // EventEmitters, we do not listen for `error` events here.
    emitter.addEventListener(name, function wrapListener(arg) {
      // IE does not have builtin `{ once: true }` support so we
      // have to do it manually.
      if (flags.once) {
        emitter.removeEventListener(name, wrapListener);
      }
      listener(arg);
    });
  } else {
    throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
  }
}


/***/ }),

/***/ 608:
/***/ ((__unused_webpack_module, exports) => {

/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}


/***/ }),

/***/ 490:
/***/ ((module) => {

"use strict";

module.exports = (promise, onFinally) => {
	onFinally = onFinally || (() => {});

	return promise.then(
		val => new Promise(resolve => {
			resolve(onFinally());
		}).then(() => val),
		err => new Promise(resolve => {
			resolve(onFinally());
		}).then(() => {
			throw err;
		})
	);
};


/***/ }),

/***/ 10:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const EventEmitter = __webpack_require__(399);
const p_timeout_1 = __webpack_require__(402);
const priority_queue_1 = __webpack_require__(986);
// eslint-disable-next-line @typescript-eslint/no-empty-function
const empty = () => { };
const timeoutError = new p_timeout_1.TimeoutError();
/**
Promise queue with concurrency control.
*/
class PQueue extends EventEmitter {
    constructor(options) {
        var _a, _b, _c, _d;
        super();
        this._intervalCount = 0;
        this._intervalEnd = 0;
        this._pendingCount = 0;
        this._resolveEmpty = empty;
        this._resolveIdle = empty;
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        options = Object.assign({ carryoverConcurrencyCount: false, intervalCap: Infinity, interval: 0, concurrency: Infinity, autoStart: true, queueClass: priority_queue_1.default }, options);
        if (!(typeof options.intervalCap === 'number' && options.intervalCap >= 1)) {
            throw new TypeError(`Expected \`intervalCap\` to be a number from 1 and up, got \`${(_b = (_a = options.intervalCap) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : ''}\` (${typeof options.intervalCap})`);
        }
        if (options.interval === undefined || !(Number.isFinite(options.interval) && options.interval >= 0)) {
            throw new TypeError(`Expected \`interval\` to be a finite number >= 0, got \`${(_d = (_c = options.interval) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : ''}\` (${typeof options.interval})`);
        }
        this._carryoverConcurrencyCount = options.carryoverConcurrencyCount;
        this._isIntervalIgnored = options.intervalCap === Infinity || options.interval === 0;
        this._intervalCap = options.intervalCap;
        this._interval = options.interval;
        this._queue = new options.queueClass();
        this._queueClass = options.queueClass;
        this.concurrency = options.concurrency;
        this._timeout = options.timeout;
        this._throwOnTimeout = options.throwOnTimeout === true;
        this._isPaused = options.autoStart === false;
    }
    get _doesIntervalAllowAnother() {
        return this._isIntervalIgnored || this._intervalCount < this._intervalCap;
    }
    get _doesConcurrentAllowAnother() {
        return this._pendingCount < this._concurrency;
    }
    _next() {
        this._pendingCount--;
        this._tryToStartAnother();
        this.emit('next');
    }
    _resolvePromises() {
        this._resolveEmpty();
        this._resolveEmpty = empty;
        if (this._pendingCount === 0) {
            this._resolveIdle();
            this._resolveIdle = empty;
            this.emit('idle');
        }
    }
    _onResumeInterval() {
        this._onInterval();
        this._initializeIntervalIfNeeded();
        this._timeoutId = undefined;
    }
    _isIntervalPaused() {
        const now = Date.now();
        if (this._intervalId === undefined) {
            const delay = this._intervalEnd - now;
            if (delay < 0) {
                // Act as the interval was done
                // We don't need to resume it here because it will be resumed on line 160
                this._intervalCount = (this._carryoverConcurrencyCount) ? this._pendingCount : 0;
            }
            else {
                // Act as the interval is pending
                if (this._timeoutId === undefined) {
                    this._timeoutId = setTimeout(() => {
                        this._onResumeInterval();
                    }, delay);
                }
                return true;
            }
        }
        return false;
    }
    _tryToStartAnother() {
        if (this._queue.size === 0) {
            // We can clear the interval ("pause")
            // Because we can redo it later ("resume")
            if (this._intervalId) {
                clearInterval(this._intervalId);
            }
            this._intervalId = undefined;
            this._resolvePromises();
            return false;
        }
        if (!this._isPaused) {
            const canInitializeInterval = !this._isIntervalPaused();
            if (this._doesIntervalAllowAnother && this._doesConcurrentAllowAnother) {
                const job = this._queue.dequeue();
                if (!job) {
                    return false;
                }
                this.emit('active');
                job();
                if (canInitializeInterval) {
                    this._initializeIntervalIfNeeded();
                }
                return true;
            }
        }
        return false;
    }
    _initializeIntervalIfNeeded() {
        if (this._isIntervalIgnored || this._intervalId !== undefined) {
            return;
        }
        this._intervalId = setInterval(() => {
            this._onInterval();
        }, this._interval);
        this._intervalEnd = Date.now() + this._interval;
    }
    _onInterval() {
        if (this._intervalCount === 0 && this._pendingCount === 0 && this._intervalId) {
            clearInterval(this._intervalId);
            this._intervalId = undefined;
        }
        this._intervalCount = this._carryoverConcurrencyCount ? this._pendingCount : 0;
        this._processQueue();
    }
    /**
    Executes all queued functions until it reaches the limit.
    */
    _processQueue() {
        // eslint-disable-next-line no-empty
        while (this._tryToStartAnother()) { }
    }
    get concurrency() {
        return this._concurrency;
    }
    set concurrency(newConcurrency) {
        if (!(typeof newConcurrency === 'number' && newConcurrency >= 1)) {
            throw new TypeError(`Expected \`concurrency\` to be a number from 1 and up, got \`${newConcurrency}\` (${typeof newConcurrency})`);
        }
        this._concurrency = newConcurrency;
        this._processQueue();
    }
    /**
    Adds a sync or async task to the queue. Always returns a promise.
    */
    async add(fn, options = {}) {
        return new Promise((resolve, reject) => {
            const run = async () => {
                this._pendingCount++;
                this._intervalCount++;
                try {
                    const operation = (this._timeout === undefined && options.timeout === undefined) ? fn() : p_timeout_1.default(Promise.resolve(fn()), (options.timeout === undefined ? this._timeout : options.timeout), () => {
                        if (options.throwOnTimeout === undefined ? this._throwOnTimeout : options.throwOnTimeout) {
                            reject(timeoutError);
                        }
                        return undefined;
                    });
                    resolve(await operation);
                }
                catch (error) {
                    reject(error);
                }
                this._next();
            };
            this._queue.enqueue(run, options);
            this._tryToStartAnother();
            this.emit('add');
        });
    }
    /**
    Same as `.add()`, but accepts an array of sync or async functions.

    @returns A promise that resolves when all functions are resolved.
    */
    async addAll(functions, options) {
        return Promise.all(functions.map(async (function_) => this.add(function_, options)));
    }
    /**
    Start (or resume) executing enqueued tasks within concurrency limit. No need to call this if queue is not paused (via `options.autoStart = false` or by `.pause()` method.)
    */
    start() {
        if (!this._isPaused) {
            return this;
        }
        this._isPaused = false;
        this._processQueue();
        return this;
    }
    /**
    Put queue execution on hold.
    */
    pause() {
        this._isPaused = true;
    }
    /**
    Clear the queue.
    */
    clear() {
        this._queue = new this._queueClass();
    }
    /**
    Can be called multiple times. Useful if you for example add additional items at a later time.

    @returns A promise that settles when the queue becomes empty.
    */
    async onEmpty() {
        // Instantly resolve if the queue is empty
        if (this._queue.size === 0) {
            return;
        }
        return new Promise(resolve => {
            const existingResolve = this._resolveEmpty;
            this._resolveEmpty = () => {
                existingResolve();
                resolve();
            };
        });
    }
    /**
    The difference with `.onEmpty` is that `.onIdle` guarantees that all work from the queue has finished. `.onEmpty` merely signals that the queue is empty, but it could mean that some promises haven't completed yet.

    @returns A promise that settles when the queue becomes empty, and all promises have completed; `queue.size === 0 && queue.pending === 0`.
    */
    async onIdle() {
        // Instantly resolve if none pending and if nothing else is queued
        if (this._pendingCount === 0 && this._queue.size === 0) {
            return;
        }
        return new Promise(resolve => {
            const existingResolve = this._resolveIdle;
            this._resolveIdle = () => {
                existingResolve();
                resolve();
            };
        });
    }
    /**
    Size of the queue.
    */
    get size() {
        return this._queue.size;
    }
    /**
    Size of the queue, filtered by the given options.

    For example, this can be used to find the number of items remaining in the queue with a specific priority level.
    */
    sizeBy(options) {
        // eslint-disable-next-line unicorn/no-fn-reference-in-iterator
        return this._queue.filter(options).length;
    }
    /**
    Number of pending promises.
    */
    get pending() {
        return this._pendingCount;
    }
    /**
    Whether the queue is currently paused.
    */
    get isPaused() {
        return this._isPaused;
    }
    get timeout() {
        return this._timeout;
    }
    /**
    Set the timeout for future operations.
    */
    set timeout(milliseconds) {
        this._timeout = milliseconds;
    }
}
exports["default"] = PQueue;


/***/ }),

/***/ 982:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
// Port of lower_bound from https://en.cppreference.com/w/cpp/algorithm/lower_bound
// Used to compute insertion index to keep queue sorted after insertion
function lowerBound(array, value, comparator) {
    let first = 0;
    let count = array.length;
    while (count > 0) {
        const step = (count / 2) | 0;
        let it = first + step;
        if (comparator(array[it], value) <= 0) {
            first = ++it;
            count -= step + 1;
        }
        else {
            count = step;
        }
    }
    return first;
}
exports["default"] = lowerBound;


/***/ }),

/***/ 986:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const lower_bound_1 = __webpack_require__(982);
class PriorityQueue {
    constructor() {
        this._queue = [];
    }
    enqueue(run, options) {
        options = Object.assign({ priority: 0 }, options);
        const element = {
            priority: options.priority,
            run
        };
        if (this.size && this._queue[this.size - 1].priority >= options.priority) {
            this._queue.push(element);
            return;
        }
        const index = lower_bound_1.default(this._queue, element, (a, b) => b.priority - a.priority);
        this._queue.splice(index, 0, element);
    }
    dequeue() {
        const item = this._queue.shift();
        return item === null || item === void 0 ? void 0 : item.run;
    }
    filter(options) {
        return this._queue.filter((element) => element.priority === options.priority).map((element) => element.run);
    }
    get size() {
        return this._queue.length;
    }
}
exports["default"] = PriorityQueue;


/***/ }),

/***/ 402:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const pFinally = __webpack_require__(490);

class TimeoutError extends Error {
	constructor(message) {
		super(message);
		this.name = 'TimeoutError';
	}
}

const pTimeout = (promise, milliseconds, fallback) => new Promise((resolve, reject) => {
	if (typeof milliseconds !== 'number' || milliseconds < 0) {
		throw new TypeError('Expected `milliseconds` to be a positive number');
	}

	if (milliseconds === Infinity) {
		resolve(promise);
		return;
	}

	const timer = setTimeout(() => {
		if (typeof fallback === 'function') {
			try {
				resolve(fallback());
			} catch (error) {
				reject(error);
			}

			return;
		}

		const message = typeof fallback === 'string' ? fallback : `Promise timed out after ${milliseconds} milliseconds`;
		const timeoutError = fallback instanceof Error ? fallback : new TimeoutError(message);

		if (typeof promise.cancel === 'function') {
			promise.cancel();
		}

		reject(timeoutError);
	}, milliseconds);

	// TODO: Use native `finally` keyword when targeting Node.js 10
	pFinally(
		// eslint-disable-next-line promise/prefer-await-to-then
		promise.then(resolve, reject),
		() => {
			clearTimeout(timer);
		}
	);
});

module.exports = pTimeout;
// TODO: Remove this for the next major release
module.exports["default"] = pTimeout;

module.exports.TimeoutError = TimeoutError;


/***/ }),

/***/ 815:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

/*
 * This file contains public type interfaces.
 * If changing these, consider whether it might be a breaking change.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
//# sourceMappingURL=api.js.map

/***/ }),

/***/ 602:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
//# sourceMappingURL=genericHIDDevice.js.map

/***/ }),

/***/ 613:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.XKeys = void 0;
__exportStar(__webpack_require__(441), exports);
__exportStar(__webpack_require__(815), exports);
__exportStar(__webpack_require__(313), exports);
__exportStar(__webpack_require__(602), exports);
var xkeys_1 = __webpack_require__(622);
Object.defineProperty(exports, "XKeys", ({ enumerable: true, get: function () { return xkeys_1.XKeys; } }));
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 441:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

/*
 * This file contains internal convenience functions
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.describeEvent = exports.literal = void 0;
/** Convenience function to force the input to be of a certain type. */
function literal(o) {
    return o;
}
exports.literal = literal;
function describeEvent(event, args) {
    const metadataStr = (metadata) => {
        if (typeof metadata !== 'object')
            return `${metadata}`;
        if (metadata === null)
            return 'null';
        const strs = [];
        Object.entries(metadata).forEach(([key, value]) => {
            strs.push(`${key}: ${value}`);
        });
        return strs.join(', ');
    };
    if (event === 'down') {
        const keyIndex = args[0];
        const metadata = args[1];
        return `Button ${keyIndex} pressed.  Metadata: ${metadataStr(metadata)}`;
    }
    else if (event === 'up') {
        const keyIndex = args[0];
        const metadata = args[1];
        return `Button ${keyIndex} released. Metadata: ${metadataStr(metadata)}`;
    }
    else if (event === 'jog') {
        const index = args[0];
        const value = args[1];
        const metadata = args[2];
        return `Jog ( index ${index}) value: ${value}. Metadata: ${metadataStr(metadata)}`;
    }
    else if (event === 'shuttle') {
        const index = args[0];
        const value = args[1];
        const metadata = args[2];
        return `Shuttle ( index ${index}) value: ${value}. Metadata: ${metadataStr(metadata)}`;
    }
    else if (event === 'joystick') {
        const index = args[0];
        const value = JSON.stringify(args[1]);
        const metadata = args[2];
        return `Joystick ( index ${index}) value: ${value}. Metadata: ${metadataStr(metadata)}`;
    }
    else if (event === 'tbar') {
        const index = args[0];
        const value = args[1];
        const metadata = args[2];
        return `T-bar ( index ${index}) value: ${value}. Metadata: ${metadataStr(metadata)}`;
    }
    else if (event === 'disconnected') {
        return `Panel disconnected!`;
    }
    throw new Error('Unhnandled event!');
}
exports.describeEvent = describeEvent;
//# sourceMappingURL=lib.js.map

/***/ }),

/***/ 313:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PRODUCTS = exports.BackLightType = exports.XKEYS_VENDOR_ID = void 0;
const lib_1 = __webpack_require__(441);
/*
 * This file contains information about the various X-keys panels
 */
exports.XKEYS_VENDOR_ID = 1523;
var BackLightType;
(function (BackLightType) {
    /** No back lights */
    BackLightType[BackLightType["NONE"] = 0] = "NONE";
    /** Legacy LED:s, blue and red backlights */
    BackLightType[BackLightType["LEGACY"] = 2] = "LEGACY";
    /** Only blue light. Is the stick buttons, that requires special mapping. */
    BackLightType[BackLightType["STICK_BUTTONS"] = 3] = "STICK_BUTTONS";
    /** Backlight LED type 4, is the 40 buttons, map keyIndex-1 to ledIndex */
    BackLightType[BackLightType["LINEAR"] = 4] = "LINEAR";
    /** Backlight LED type 5 is the RGB 24 buttons */
    BackLightType[BackLightType["REMAP_24"] = 5] = "REMAP_24";
    /** Backlight LED type 6 is the RGB 2 banks most XKB modules */
    BackLightType[BackLightType["RGBx2"] = 6] = "RGBx2";
})(BackLightType = exports.BackLightType || (exports.BackLightType = {}));
exports.PRODUCTS = {
    // Note: The byte numbers are byte index (starts with 0) and will be offset from PIE SDK documentation by -2
    // the byte index is used to access the exact byte in the data report.
    XK24: (0, lib_1.literal)({
        name: 'XK-24',
        hidDevices: [
            [1029, 0],
            [1027, 0],
        ],
        bBytes: 4,
        bBits: 6,
        layouts: [['Keys', 0, 1, 1, 6, 4]],
        colCount: 4,
        rowCount: 6,
        hasPS: true,
        backLightType: BackLightType.LEGACY,
        backLight2offset: 32,
        timestampByte: 6, // index of first of 4 bytes, ms time since device boot, 4 byte BE
    }),
    XK24RGB: (0, lib_1.literal)({
        name: 'XK-24M-RGB',
        hidDevices: [[1404, 0]],
        bBytes: 4,
        bBits: 6,
        colCount: 4,
        rowCount: 6,
        hasPS: true,
        backLightType: BackLightType.REMAP_24,
        backLight2offset: 0,
        timestampByte: 6, // index of first of 4 bytes, ms time since device boot, 4 byte BE
    }),
    XK4: (0, lib_1.literal)({
        name: 'XK-4 Stick',
        hidDevices: [
            [1127, 0],
            [1129, 0],
        ],
        bBytes: 4,
        bBits: 1,
        colCount: 4,
        rowCount: 1,
        hasPS: true,
        backLightType: BackLightType.STICK_BUTTONS,
        backLight2offset: 0,
        timestampByte: 6, // ms time since device boot 4 byte BE
    }),
    XK8: (0, lib_1.literal)({
        name: 'XK-8 Stick',
        hidDevices: [
            [1130, 0],
            [1132, 0],
        ],
        bBytes: 4,
        bBits: 2,
        colCount: 8,
        rowCount: 1,
        hasPS: true,
        backLightType: BackLightType.STICK_BUTTONS,
        backLight2offset: 0,
        timestampByte: 6,
        btnLocation: [
            [0, 0],
            [1, 1],
            [1, 5],
            [1, 2],
            [1, 6],
            [1, 3],
            [1, 7],
            [1, 4],
            [1, 8],
        ], // map button index to [Row,Column] 0,0 is program switch
    }),
    XK16: (0, lib_1.literal)({
        name: 'XK-16 Stick',
        hidDevices: [
            [1049, 0],
            [1051, 0],
            [1213, 0],
            [1216, 0],
        ],
        bBytes: 4,
        bBits: 4,
        colCount: 16,
        rowCount: 1,
        hasPS: true,
        backLightType: BackLightType.STICK_BUTTONS,
        backLight2offset: 0,
        timestampByte: 6,
        btnLocation: [
            [0, 0],
            [1, 1],
            [1, 5],
            [1, 9],
            [1, 13],
            [1, 2],
            [1, 6],
            [1, 10],
            [1, 14],
            [1, 3],
            [1, 7],
            [1, 11],
            [1, 15],
            [1, 4],
            [1, 8],
            [1, 12],
            [1, 16],
        ],
    }),
    XK12JOG: (0, lib_1.literal)({
        name: 'XK-12 Jog-Shuttle',
        hidDevices: [
            [1062, 0],
            [1064, 0],
        ],
        bBytes: 4,
        bBits: 3,
        colCount: 4,
        rowCount: 3,
        hasPS: true,
        hasJog: [{ jogByte: 6 }],
        hasShuttle: [{ shuttleByte: 7 }],
        backLightType: BackLightType.LEGACY,
        backLight2offset: 32,
        timestampByte: 8, // ms time since device boot 4 byte BE
    }),
    XK12JOYSTICK: (0, lib_1.literal)({
        name: 'XK-12 Joystick',
        hidDevices: [
            [1065, 0],
            [1067, 0],
        ],
        bBytes: 4,
        bBits: 3,
        colCount: 4,
        rowCount: 3,
        hasPS: true,
        hasJoystick: [
            {
                joyXbyte: 6,
                joyYbyte: 7,
                joyZbyte: 8, //Joystick Z motion, twist of stick, absolute 0 to 255, rolls over,
            },
        ],
        backLightType: BackLightType.LEGACY,
        backLight2offset: 32,
        timestampByte: 12,
    }),
    XK68JOYSTICK: (0, lib_1.literal)({
        name: 'XK-68 Joystick',
        hidDevices: [
            [1117, 0],
            [1119, 0],
        ],
        bBytes: 10,
        bBits: 8,
        layouts: [
            ['Keys', 0, 1, 1, 8, 10],
            ['Joystick', 0, 4, 4, 6, 7],
        ],
        colCount: 10,
        rowCount: 8,
        hasPS: true,
        hasJoystick: [
            {
                joyXbyte: 14,
                joyYbyte: 15,
                joyZbyte: 16, //Joystick Z motion, twist of stick, absolute 0 to 255, rolls over
            },
        ],
        backLightType: BackLightType.LEGACY,
        backLight2offset: 80,
        timestampByte: 18,
        disableButtons: [28, 29, 30, 36, 37, 38, 44, 45, 46, 52, 53, 54], // these are the index of the "hole" created by the joystick in the center, they will always be 0
    }),
    XKR32: (0, lib_1.literal)({
        // discontinued product, XKE 40 is viable replacement
        name: 'XKR-32',
        hidDevices: [
            [1279, 0],
            [1282, 0],
        ],
        bBytes: 4,
        bBits: 8,
        colCount: 16,
        rowCount: 2,
        hasPS: false,
        backLightType: BackLightType.LEGACY,
        backLight2offset: 32,
        timestampByte: 31, // ms time since device boot 4 byte BE
    }),
    XKE40: (0, lib_1.literal)({
        name: 'XKE-40',
        hidDevices: [
            [1355, 0],
            [1356, 0],
            [1357, 0],
            [1358, 0],
            [1359, 0],
            [1360, 0],
            [1361, 0],
        ],
        bBytes: 5,
        bBits: 8,
        colCount: 20,
        rowCount: 2,
        hasPS: true,
        backLightType: BackLightType.LINEAR,
        backLight2offset: 40,
        timestampByte: 31,
        btnLocation: [
            [0, 0],
            [1, 1],
            [1, 2],
            [1, 3],
            [1, 4],
            [1, 5],
            [1, 6],
            [1, 7],
            [1, 8],
            [1, 9],
            [1, 10],
            [1, 11],
            [1, 12],
            [1, 13],
            [1, 14],
            [1, 15],
            [1, 16],
            [1, 17],
            [1, 18],
            [1, 19],
            [1, 20],
            [2, 1],
            [2, 2],
            [2, 3],
            [2, 4],
            [2, 5],
            [2, 6],
            [2, 7],
            [2, 8],
            [2, 9],
            [2, 10],
            [2, 11],
            [2, 12],
            [2, 13],
            [2, 14],
            [2, 15],
            [2, 16],
            [2, 17],
            [2, 18],
            [2, 19],
            [2, 20],
        ],
    }),
    XK60: (0, lib_1.literal)({
        name: 'XK-60',
        hidDevices: [
            [1121, 0],
            [1123, 0],
            [1231, 0],
            [1234, 0],
        ],
        bBytes: 10,
        bBits: 8,
        layouts: [
            ['Keys', 0, 1, 1, 2, 10],
            ['Keys', 1, 4, 1, 8, 20],
            ['Keys', 2, 4, 4, 8, 7],
            ['Keys', 3, 4, 9, 8, 10],
        ],
        colCount: 10,
        rowCount: 8,
        hasPS: true,
        backLightType: BackLightType.LEGACY,
        backLight2offset: 80,
        timestampByte: 12, // ms time since device boot 4 byte BE
        //disableButtons: 	[2,10,18,26,34,42,50,58,66,74,19,20,21,22,23,59,60,61,] // these buttons are not installed on the 60 button unit, these bytes will always be 0.
    }),
    XK80: (0, lib_1.literal)({
        name: 'XK-80',
        hidDevices: [
            [1089, 0],
            [1091, 0],
            [1217, 0],
            [1220, 0],
        ],
        bBytes: 10,
        bBits: 8,
        colCount: 10,
        rowCount: 8,
        hasPS: true,
        backLightType: BackLightType.LEGACY,
        backLight2offset: 80,
        timestampByte: 12, // ms time since device boot 4 byte BE
    }),
    XKE124TBAR: (0, lib_1.literal)({
        name: 'XKE-124 T-bar',
        hidDevices: [
            [1275, 0],
            [1278, 0],
        ],
        bBytes: 16,
        bBits: 8,
        layouts: [
            ['Keys', 0, 1, 1, 8, 16],
            ['Tbar', 0, 5, 14, 8, 14],
        ],
        colCount: 16,
        rowCount: 8,
        hasPS: false,
        hasTbar: [
            {
                tbarByte: 28, //this gives a clean 0-255 value
            },
        ],
        backLightType: BackLightType.LEGACY,
        backLight2offset: 128,
        //timeStamp:	31, // the XKE-124 T-bar has no time stamp for technical reasons
        disableButtons: [109, 110, 111, 112],
    }),
    XKE128: (0, lib_1.literal)({
        name: 'XKE-128',
        hidDevices: [
            [1227, 0],
            [1230, 0],
        ],
        bBytes: 16,
        bBits: 8,
        colCount: 16,
        rowCount: 8,
        hasPS: false,
        backLightType: BackLightType.LEGACY,
        backLight2offset: 128,
        timestampByte: 31, // ms time since device boot 4 byte BE
    }),
    XKMatrix: (0, lib_1.literal)({
        name: 'XK-128 Matrix',
        hidDevices: [
            [1030, 0],
            [1032, 0],
        ],
        bBytes: 16,
        bBits: 8,
        colCount: 16,
        rowCount: 8,
        hasPS: true,
        backLightType: BackLightType.NONE,
        backLight2offset: 0,
        timestampByte: 18, // ms time since device boot 4 byte BE
        // many buttons may be disabled or not as the custom wiring determines this.
        // to prevent phantom buttons, external diodes may be required, if diodes not used the board may be set by write command 215, see documentation
    }),
    XK68JOGSHUTTLE: (0, lib_1.literal)({
        name: 'XK-68 Jog-Shuttle',
        hidDevices: [
            [1114, 0],
            [1116, 0],
        ],
        bBytes: 10,
        bBits: 8,
        layouts: [
            ['Keys', 0, 1, 1, 8, 10],
            ['Jog-Shuttle', 0, 6, 4, 8, 7],
        ],
        colCount: 10,
        rowCount: 8,
        hasPS: true,
        hasJog: [{ jogByte: 16 }],
        hasShuttle: [{ shuttleByte: 17 }],
        backLightType: BackLightType.LEGACY,
        backLight2offset: 80,
        timestampByte: 18,
        disableButtons: [30, 31, 32, 38, 39, 40, 46, 47, 48, 54, 55, 56],
    }),
    XK3FOOT: (0, lib_1.literal)({
        name: 'XK-3 Foot Pedal',
        hidDevices: [
            [1080, 0],
            [1082, 0],
        ],
        bBytes: 1,
        bBits: 4,
        colCount: 3,
        rowCount: 1,
        hasPS: true,
        backLightType: BackLightType.NONE,
        backLight2offset: 0,
        timestampByte: 18,
        btnLocation: [
            [0, 0],
            [0, 0],
            [1, 1],
            [1, 2],
            [1, 3],
        ],
        disableButtons: [1],
    }),
    XK3SI: (0, lib_1.literal)({
        name: 'XK-3 Switch Interface',
        hidDevices: [
            [1221, 0],
            [1224, 0],
        ],
        bBytes: 1,
        bBits: 5,
        colCount: 3,
        rowCount: 1,
        hasPS: false,
        backLightType: BackLightType.NONE,
        backLight2offset: 0,
        timestampByte: 31,
        btnLocation: [
            [0, 0],
            [1, 1],
            [1, 2],
            [1, 0],
            [2, 0],
            [1, 3],
        ],
        disableButtons: [4], // Exclude index 4, redundant on index 3, note some or all of the buttons may be triggered when plugging switch into 3.5 mm socket
    }),
    XK12SI: (0, lib_1.literal)({
        name: 'XK-12 Switch Interface',
        hidDevices: [
            [1192, 0],
            [1195, 0],
        ],
        bBytes: 2,
        bBits: 8,
        layouts: [
            ['SwitchPorts', 0, 1, 1, 2, 3],
            ['SwitchPorts', 1, 1, 4, 2, 6],
        ],
        colCount: 6,
        rowCount: 2,
        hasPS: false,
        backLightType: BackLightType.NONE,
        backLight2offset: 0,
        timestampByte: 31,
        btnLocation: [
            [0, 0],
            [2, 1],
            [1, 1],
            [2, 2],
            [1, 2],
            [2, 3],
            [1, 3],
            [2, 4],
            [1, 4],
            [2, 5],
            [1, 5],
            [2, 6],
            [1, 6],
        ], // column indicates port #, mono plugs map to row 1, stereo plugs to row 1 and 2
        // due to the stereo jack some buttons may always be down when a single pole (mono) plug is plugged in.
    }),
    XKHD15WI: (0, lib_1.literal)({
        name: 'XK-HD15 Wire Interface',
        hidDevices: [
            [1244, 0],
            [1247, 0],
        ],
        bBytes: 2,
        bBits: 8,
        colCount: 1,
        rowCount: 14,
        hasPS: false,
        backLightType: BackLightType.NONE,
        backLight2offset: 0,
        timestampByte: 31, // ms time since device boot 4 byte BE
    }),
    XKHD15GPIO: (0, lib_1.literal)({
        name: 'XK-HD15 GPIO',
        hidDevices: [
            [1351, 0],
            [1354, 0],
        ],
        bBytes: 2,
        bBits: 8,
        colCount: 1,
        rowCount: 14,
        hasPS: false,
        backLightType: BackLightType.NONE,
        backLight2offset: 0,
        hasGPIO: true,
        timestampByte: 31, // ms time since device boot 4 byte BE
        //The input data will always be in the 2 data bytes described, but this device may be configured in several ways
        // it is best to Qwery the device and get its current setup data, using GetIoConfiguration function
    }),
    XCRS232: (0, lib_1.literal)({
        name: 'XC-RS232-DB9',
        hidDevices: [
            [1257, 0],
            [1260, 0],
        ],
        bBytes: 2,
        bBits: 8,
        layouts: [
            ['SwitchPorts', 0, 1, 1, 2, 3],
            ['SwitchPorts', 1, 1, 4, 2, 6],
        ],
        colCount: 3,
        rowCount: 4,
        hasPS: false,
        backLightType: BackLightType.NONE,
        backLight2offset: 0,
        hasSerialData: true,
        btnLocation: [
            [0, 0],
            [2, 1],
            [1, 1],
            [2, 2],
            [1, 2],
            [2, 3],
            [1, 3],
            [2, 4],
            [1, 4],
            [2, 5],
            [1, 5],
            [2, 6],
            [1, 6],
        ], // column indicates port #, mono plugs map to row 1, stereo plugs to row 1 and 2
        //The Serial data will come on a special message with byte 1 id of 216, see documentation
    }),
    XCDMX512TST: (0, lib_1.literal)({
        name: 'XC-DMX512-T ST',
        hidDevices: [[1324, 0]],
        bBytes: 2,
        bBits: 8,
        colCount: 6,
        rowCount: 2,
        hasPS: false,
        backLightType: BackLightType.NONE,
        backLight2offset: 0,
        hasDMX: true,
        //Sends DMX512 Data, see documentation
    }),
    XCDMX512TRJ45: (0, lib_1.literal)({
        name: 'XC-DMX512-T RJ45',
        hidDevices: [[1225, 0]],
        bBytes: 1,
        bBits: 8,
        colCount: 4,
        rowCount: 2,
        hasPS: false,
        backLightType: BackLightType.NONE,
        backLight2offset: 0,
        hasDMX: true,
        btnLocation: [
            // columns are port number and row 1 is the first switch on the port and 2 is second
            [0, 0],
            [2, 1],
            [1, 1],
            [2, 2],
            [1, 2],
            [2, 3],
            [1, 3],
            [2, 4],
            [1, 4],
        ],
        //Sends DMX512 Data to DMX512 devivces on the , see documentation
    }),
    XK16LCD: (0, lib_1.literal)({
        name: 'XK-16 LCD',
        hidDevices: [
            [1316, 0],
            [1317, 0],
            [1318, 0],
            [1319, 0],
            [1320, 0],
            [1321, -1],
            [1322, 0],
        ],
        bBytes: 4,
        bBits: 4,
        colCount: 4,
        rowCount: 4,
        hasPS: true,
        hasLCD: true,
        backLightType: BackLightType.LEGACY,
        backLight2offset: 32,
        timestampByte: 31, // ms time since device boot 4 byte BE
    }),
    XKE180BROAD: (0, lib_1.literal)({
        name: 'XKE-180 Broadcast Keyboard',
        hidDevices: [[1443, 0]],
        bBytes: 31,
        bBits: 7,
        layouts: [
            ['Keys', 0, 1, 1, 2, 24],
            ['Keys', 1, 3, 1, 8, 2],
            ['QWERTY-77', 0, 3, 3, 8, 17],
            ['Keys', 2, 3, 18, 8, 20],
            ['NumPad-24', 0, 3, 21, 8, 24],
        ],
        colCount: 24,
        rowCount: 8,
        hasPS: true,
        backLightType: BackLightType.NONE,
        backLight2offset: 0,
        timestampByte: 36, // ms time since device boot 4 byte BE
    }),
    XK64JOGTBAR: (0, lib_1.literal)({
        name: 'XKE-64 Jog T-bar',
        hidDevices: [
            [1325, 0],
            [1326, 0],
            [1327, 0],
            [1328, 0],
            [1329, 0],
            [1330, 0],
            [1331, 0],
        ],
        bBytes: 10,
        bBits: 8,
        layouts: [
            ['Keys', 0, 1, 1, 8, 10],
            ['Jog-Shuttle', 0, 6, 1, 8, 4],
            ['Tbar', 0, 1, 10, 4, 10],
        ],
        colCount: 10,
        rowCount: 8,
        hasPS: false,
        hasJog: [{ jogByte: 18 }],
        hasShuttle: [{ shuttleByte: 19 }],
        hasTbar: [
            {
                tbarByte: 17,
            },
        ],
        backLightType: BackLightType.LEGACY,
        backLight2offset: 80,
        timestampByte: 31,
        disableButtons: [6, 7, 8, 14, 15, 16, 22, 23, 24, 30, 31, 32, 73, 74, 75, 73], // These bits are messy, better to ignore them
    }),
    XBK4X6: (0, lib_1.literal)({
        //new product, expected release Q4 2022
        name: 'X-blox XBK-4x6 Module',
        hidDevices: [
            [1365, 0],
            [1366, 0],
            [1367, 0],
            [1368, 0],
            [1369, 0],
            [1370, 0],
            [1371, 0],
        ],
        bBytes: 4,
        bBits: 6,
        colCount: 4,
        rowCount: 6,
        hasPS: false,
        backLightType: BackLightType.RGBx2,
        backLight2offset: 0,
        timestampByte: 31, // index of first of 4 bytes, ms time since device boot, 4 byte BE
    }),
    XBK3X6: (0, lib_1.literal)({
        //new product, expected release Q4 2022
        name: 'X-blox XBK-3x6 Module',
        hidDevices: [
            [1378, 0],
            [1379, 0],
            [1380, 0],
            [1381, 0],
            [1382, 0],
            [1383, 0],
            [1384, 0],
        ],
        bBytes: 3,
        bBits: 6,
        colCount: 3,
        rowCount: 6,
        hasPS: false,
        backLightType: BackLightType.RGBx2,
        backLight2offset: 0,
        timestampByte: 31, // index of first of 4 bytes, ms time since device boot, 4 byte BE
    }),
    XBA4X3JOG: (0, lib_1.literal)({
        //new product, expected release Q4 2022
        name: 'X-blox XBA-4x3 Jog-Shuttle Module',
        hidDevices: [
            [1388, 0],
            [1389, 0],
            [1390, 0],
            [1391, 0],
            [1392, 0],
            [1393, 0],
            [1394, 0],
        ],
        bBytes: 4,
        bBits: 3,
        colCount: 4,
        rowCount: 3,
        hasPS: false,
        hasJog: [{ jogByte: 12 }],
        hasShuttle: [{ shuttleByte: 13 }],
        backLightType: BackLightType.RGBx2,
        backLight2offset: 0,
        timestampByte: 31, // index of first of 4 bytes, ms time since device boot, 4 byte BE
    }),
    XBA3X6TBAR: (0, lib_1.literal)({
        //new product, expected release Q4 2022
        name: 'X-blox XBA-3x6 T-bar Module',
        hidDevices: [
            [1396, 0],
            [1397, 0],
            [1398, 0],
            [1399, 0],
            [1400, 0],
            [1401, 0],
            [1402, 0],
        ],
        bBytes: 3,
        bBits: 6,
        colCount: 3,
        rowCount: 6,
        hasPS: false,
        hasTbar: [
            {
                tbarByte: 8, // value Was incorrect, 8 is correct
            },
        ],
        backLightType: BackLightType.RGBx2,
        backLight2offset: 0,
        timestampByte: 31, // index of first of 4 bytes, ms time since device boot, 4 byte BE
    }),
    XBA4X3TRACKBALL: (0, lib_1.literal)({
        //new product, expected release Q4 2022
        name: 'X-blox XBA-4x3 Trackball Module',
        hidDevices: [
            [1488, 0],
            [1489, 0],
            [1490, 0],
            [1491, 0],
            [1492, 0],
            [1493, 0],
            [1494, 0],
        ],
        bBytes: 4,
        bBits: 3,
        colCount: 4,
        rowCount: 3,
        hasPS: false,
        hasTrackball: [
            {
                trackXbyte_L: 7,
                trackXbyte_H: 8,
                trackYbyte_L: 9,
                trackYbyte_H: 10, //Delta Y motion, High byte of 2 byte date, Y ball motion = 256*DELTA_Y_H + DELTA_Y_L.
            },
        ],
        // this handles extra button like would be beside the track ball.
        hasExtraButtons: [
            {
                ebByte: 5,
                ebBit: 3, // the bit of the extra button
            },
            {
                ebByte: 5,
                ebBit: 4, // the bit of the extra button
            },
        ],
        backLightType: BackLightType.RGBx2,
        backLight2offset: 0,
        timestampByte: 31, // index of first of 4 bytes, ms time since device boot, 4 byte BE
    }),
    XBK_QWERTY: (0, lib_1.literal)({
        //new product, expected release Q1 2023
        name: 'X-blox XBK-QWERTY Module',
        hidDevices: [
            [1343, 0],
            [1344, 0],
            [1345, 0],
            [1346, 0],
            [1347, 0],
            [1348, 0],
            [1349, 0],
        ],
        bBytes: 32,
        bBits: 6,
        layouts: [
            ['Keys', 0, 1, 1, 6, 8],
            ['QWERTY-85', 0, 1, 9, 6, 24],
            ['Keys', 1, 1, 25, 6, 32], // right side satellite keys, optional
        ],
        colCount: 32,
        rowCount: 6,
        hasPS: false,
        backLightType: BackLightType.RGBx2,
        backLight2offset: 0,
        timestampByte: 36, // index of first of 4 bytes, ms time since device boot, 4 byte BE
    }),
    XBK16X6: (0, lib_1.literal)({
        //new product, expected release Q1 2023
        name: 'X-blox XBK-16x6 Module',
        hidDevices: [
            [1496, 0],
            [1497, 0],
            [1498, 0],
            [1499, 0],
            [1500, 0],
            [1501, 0],
            [1502, 0],
        ],
        bBytes: 16,
        bBits: 6,
        colCount: 16,
        rowCount: 6,
        hasPS: false,
        backLightType: BackLightType.RGBx2,
        backLight2offset: 0,
        timestampByte: 31, // index of first of 4 bytes, ms time since device boot, 4 byte BE
    }),
    XCDRCSERVO: (0, lib_1.literal)({
        //new product, expected release Q1 2023
        name: 'XC-RC Servo',
        hidDevices: [[1364, 0]],
        bBytes: 1,
        bBits: 8,
        colCount: 4,
        rowCount: 2,
        hasPS: true,
        backLightType: BackLightType.NONE,
        backLight2offset: 0,
        btnLocation: [
            // columns are port number and row 1 is the first switch on the port and 2 is second
            [0, 0],
            [2, 1],
            [1, 1],
            [2, 2],
            [1, 2],
            [2, 3],
            [1, 3],
            [2, 4],
            [1, 4],
        ],
    }),
    XCRELAY: (0, lib_1.literal)({
        //prototype product,
        name: 'XC-Relay',
        hidDevices: [[1363, 0]],
        bBytes: 1,
        bBits: 8,
        colCount: 4,
        rowCount: 2,
        hasPS: true,
        backLightType: BackLightType.NONE,
        backLight2offset: 0,
        btnLocation: [
            // columns are port number and row 1 is the first switch on the port and 2 is second
            [0, 0],
            [2, 1],
            [1, 1],
            [2, 2],
            [1, 2],
            [2, 3],
            [1, 3],
            [2, 4],
            [1, 4],
        ],
    }),
    XCMOTORDRIVER: (0, lib_1.literal)({
        //prototype product,
        name: 'XC-Motor Driver',
        hidDevices: [[1456, 0]],
        bBytes: 1,
        bBits: 8,
        colCount: 4,
        rowCount: 2,
        hasPS: true,
        hasGPIO: true,
        hasADC: [
            {
                adcByte_L: 6,
                adcByte_H: 7, //ADC Value, High byte of 2 byte date,
            },
            {
                adcByte_L: 8,
                adcByte_H: 9, //ADC Value, High byte of 2 byte date,
            },
            {
                adcByte_L: 10,
                adcByte_H: 11, //ADC Value, High byte of 2 byte date,
            },
            {
                adcByte_L: 12,
                adcByte_H: 13, //ADC Value, High byte of 2 byte date,
            },
        ],
        backLightType: BackLightType.NONE,
        backLight2offset: 0,
        btnLocation: [
            // columns are port number and row 1 is the first switch on the port and 2 is second
            [0, 0],
            [2, 1],
            [1, 1],
            [2, 2],
            [1, 2],
            [2, 3],
            [1, 3],
            [2, 4],
            [1, 4],
        ],
    }),
    XBA4X3TRACKPAD: (0, lib_1.literal)({
        //prototype product,
        name: 'X-blox XBA-Track Pad Module',
        hidDevices: [
            [1422, 0],
            [1423, 0],
            [1424, 0],
            [1425, 0],
            [1426, 0],
            [1427, 0],
            [1428, 0],
        ],
        bBytes: 4,
        bBits: 3,
        colCount: 4,
        rowCount: 3,
        hasPS: false,
        hasTrackpad: [
            {
                padXbyte_L: 6,
                padXbyte_H: 7,
                padYbyte_L: 8,
                padYbyte_H: 9,
                pinchByte: 10,
                scrollByte: 11, // the index of the scroll byte
            },
        ],
        backLightType: BackLightType.RGBx2,
        backLight2offset: 0,
        timestampByte: 31, // index of first of 4 bytes, ms time since device boot, 4 byte BE
    }),
    XK433REMOTE: (0, lib_1.literal)({
        //prototype product,
        name: 'XK-433RF Remote',
        hidDevices: [
            [1505, 0],
            [1506, 0],
            [1507, 0],
            [1508, 0],
            [1509, 0],
            [1510, 0],
        ],
        bBytes: 2,
        bBits: 8,
        layouts: [
            ['Remote', 0, 1, 1, 2, 4],
            ['SwitchPorts', 0, 1, 1, 2, 2],
            ['SwitchPorts', 1, 1, 3, 2, 4],
        ],
        colCount: 4,
        rowCount: 2,
        hasPS: true,
        backLightType: BackLightType.NONE,
        backLight2offset: 0,
        timestampByte: 31,
        btnLocation: [
            [0, 0],
            [2, 1],
            [1, 1],
            [2, 2],
            [1, 2],
            [2, 3],
            [1, 3],
            [2, 4],
            [1, 4],
            [2, 5],
            [1, 5],
            [2, 6],
            [1, 6],
        ], // column indicates port #, mono plugs map to row 1, stereo plugs to row 1 and 2
        // due to the stereo jack some buttons may always be down when a single pole (mono) plug is plugged in.
    }),
    RailDriver: (0, lib_1.literal)({
        //In production: www.raildriver.com
        name: 'RailDriver Cab Controller',
        hidDevices: [
            [210, 0],
            [210, -1],
        ],
        bBytes: 6,
        bBits: 8,
        layouts: [
            ['Cab Buttons', 0, 1, 1, 2, 4],
            ['Horn', 0, 1, 3, 2, 3],
            ['Reverser', 0, 1, 4, 4, 4],
            ['Throttle', 0, 1, 5, 4, 5],
            ['Auto Brake', 0, 1, 6, 4, 6],
            ['Ind Brake', 0, 1, 7, 4, 7],
            ['Bail Off', 0, 1, 8, 4, 8],
            ['Wiper', 0, 1, 9, 4, 9],
            ['Lights', 0, 3, 9, 4, 9],
        ],
        colCount: 6,
        rowCount: 8,
        hasPS: false,
        hasTbar: [
            // the raildriver has 5 lever controls, we will call them T-bars for this mapping
            {
                tbarByte: 8, //Reverser Lever
            },
            {
                tbarByte: 9, //Throttle Lever
            },
            {
                tbarByte: 10, //Auto Brake Lever
            },
            {
                tbarByte: 11, //Independent Brake
            },
            //{
            //	tbarByte: 12, //Bail Off, moving Ind Brake to Right, this is changed to a single bit in the remapping.
            //},
        ],
        hasRotary: [
            // the raildriver has 2 rotary controls,
            {
                rotaryByte: 12, //Upper twist knob
            },
            {
                rotaryByte: 13, //Lower twist knob
            },
        ],
        backLightType: BackLightType.NONE,
        backLight2offset: 0,
        //timestamp: none, RailDriver has no time stamp
    }),
};
//# sourceMappingURL=products.js.map

/***/ }),

/***/ 622:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.XKeys = void 0;
const events_1 = __webpack_require__(531);
const products_1 = __webpack_require__(313);
const lib_1 = __webpack_require__(441);
class XKeys extends events_1.EventEmitter {
    constructor(device, deviceInfo, _devicePath) {
        super();
        this.device = device;
        this.deviceInfo = deviceInfo;
        this._devicePath = _devicePath;
        /** All button states */
        this._buttonStates = new Map();
        /** Analogue states, such as jog-wheels, shuttle etc */
        this._analogStates = {
            jog: [],
            joystick: [],
            shuttle: [],
            tbar: [],
            rotary: [],
            trackball: [],
        };
        this._initialized = false;
        this._firmwareVersion = 0; // is set after init()
        this._firmwareVersionIsSet = false;
        this._unitId = 0; // is set after init()
        this._unitIdIsSet = false;
        this._disconnected = false;
        this.product = this._setupDevice(deviceInfo);
    }
    /** Vendor id for the X-keys panels */
    static get vendorId() {
        return products_1.XKEYS_VENDOR_ID;
    }
    _setupDevice(deviceInfo) {
        const findProduct = () => {
            for (const product of Object.values(products_1.PRODUCTS)) {
                for (const hidDevice of product.hidDevices) {
                    if (hidDevice[0] === deviceInfo.productId &&
                        (deviceInfo.interface === null || hidDevice[1] === deviceInfo.interface)) {
                        return {
                            product,
                            productId: hidDevice[0],
                            interface: hidDevice[1],
                        }; // Return & break out of the loops
                    }
                }
            }
            // else:
            throw new Error(`Unknown/Unsupported X-keys: "${deviceInfo.product}" (productId: "${deviceInfo.productId}", interface: "${deviceInfo.interface}").\nPlease report this as an issue on our github page!`);
        };
        const found = findProduct();
        this.device.on('data', (data) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            if (deviceInfo.productId === 210) {
                // Note: The RailDriver is an older device, which doesn't follow the rest of xkeys data structure.
                // To make it easy for us, we'll just remap the data to work for us.
                const rdData = new Uint8Array(32);
                rdData[0] = 0; // this sets the Unit ID to 0 always
                if (!this._firmwareVersionIsSet) {
                    rdData[1] = 214; // Fake initial message to set _firmwareVersion
                }
                else if (!this._unitIdIsSet) {
                    rdData[1] = 3; // Fake initial message to set _unitId
                }
                else {
                    rdData[1] = 0; // no pg switch, byte is always 0
                }
                rdData[2] = data.readUInt8(7); // remap button bits
                rdData[3] = data.readUInt8(8); // remap button bits
                rdData[4] = data.readUInt8(9); // remap button bits
                rdData[5] = data.readUInt8(10); // remap button bits
                rdData[6] = data.readUInt8(11); // remap button bits
                rdData[7] = data.readUInt8(12); // remap button bits
                // Add Bailoff to button byte,
                if (data.readUInt8(4) >= 160) {
                    // set bit 5 to 1
                    rdData[7] = rdData[7] | 16;
                }
                rdData[8] = data.readUInt8(0); // remap analog bytes
                rdData[9] = data.readUInt8(1); // remap analog bytes
                rdData[10] = data.readUInt8(2); // remap analog bytes
                rdData[11] = data.readUInt8(3); // remap analog bytes
                rdData[12] = data.readUInt8(5); // remap analog bytes
                rdData[13] = data.readUInt8(6); // remap analog bytes
                for (let i = 0; i < 15; i++) {
                    data[i] = rdData[i];
                }
            }
            //------------------------
            if (data.readUInt8(1) === 214) {
                // this is a special report that does not correlate to the regular data report, it is created by sending getVersion()
                const firmVersion = data.readUInt8(10);
                // data.readUInt8(0) the unit ID is the first byte, index 0, used to tell between 2 identical X-keys, UID is set by user
                // data.readUInt16LE(11) // PID is also in this report as a double check.
                this._firmwareVersion = firmVersion || 1; // Firmware version
                this._firmwareVersionIsSet = true;
                (_a = this.receivedVersionResolve) === null || _a === void 0 ? void 0 : _a.call(this);
                return; // quit here because this data would be interpreted as button data and give bad results.
            }
            // TODO: Add other special reports here.
            // A standard data report will be sent when something physical happens on the keys, button press, or lever moved for example
            // other special reports may be sent in response to a request or some data input on the device.
            //
            if (data.readUInt8(1) > 3)
                return; // Protect against all special data reports now and into the future.
            const newButtonStates = new Map();
            const newAnalogStates = {
                jog: [],
                joystick: [],
                shuttle: [],
                tbar: [],
                rotary: [],
                trackball: [],
            };
            // UID, unit id, is used to uniquely identify a certain panel, from factory it's set to 0, it can be set by a user with this.setUID()
            const UID = data.readUInt8(0); // the unit ID is the first byte, index 0, used to tell between 2 identical X-keys, UID is set by user
            // const PID = deviceInfo.productId // from USB hardware ID
            let timestamp = undefined;
            if (this.product.timestampByte !== undefined) {
                timestamp = data.readUInt32BE(this.product.timestampByte); // Time stamp is 4 bytes, use UInt32BE
            }
            const dd = data.readUInt8(1);
            // The genData bit is set when the message is a reply to the Generate Data message
            const genData = dd & (1 << 1) ? true : false;
            if (genData) {
                // Note, the generateData is used to get the full state
                this._unitId = UID;
                this._unitIdIsSet = true;
                (_b = this.receivedGenerateDataResolve) === null || _b === void 0 ? void 0 : _b.call(this);
            }
            // Note: first button data (bByte) is on byte index 2
            for (let x = 0; x < this.product.bBytes; x++) {
                for (let y = 0; y < this.product.bBits; y++) {
                    const index = x * this.product.bBits + y + 1; // add 1 so PS is at index 0, more accurately displays the total button number, but confuses the index for other use, such as LED addressing.
                    const d = data.readUInt8(2 + x);
                    const bit = d & (1 << y) ? true : false;
                    newButtonStates.set(index, bit);
                }
            }
            if (this.product.hasPS) {
                // program switch/button is on byte index 1 , bit 1
                const d = data.readUInt8(1);
                const bit = d & (1 << 0) ? true : false; // get first bit only
                newButtonStates.set(0, bit); // always keyIndex of PS to 0
            }
            (_c = this.product.hasExtraButtons) === null || _c === void 0 ? void 0 : _c.forEach((exButton, index) => {
                //const d = data[jog.jogByte] // Jog
                //newAnalogStates.jog[index] = d < 128 ? d : d - 256
                const d = data.readUInt8(exButton.ebByte);
                const bit = d & (1 << exButton.ebBit) ? true : false;
                const startIndex = this.product.bBytes * this.product.bBits + 1; // find the end of the button array
                newButtonStates.set(startIndex + index, bit); // start the extra buttons after that.
            });
            (_d = this.product.hasJog) === null || _d === void 0 ? void 0 : _d.forEach((jog, index) => {
                const d = data[jog.jogByte]; // Jog
                newAnalogStates.jog[index] = d < 128 ? d : d - 256;
            });
            (_e = this.product.hasShuttle) === null || _e === void 0 ? void 0 : _e.forEach((shuttle, index) => {
                const d = data[shuttle.shuttleByte]; // Shuttle
                newAnalogStates.shuttle[index] = d < 128 ? d : d - 256;
            });
            (_f = this.product.hasJoystick) === null || _f === void 0 ? void 0 : _f.forEach((joystick, index) => {
                const x = data.readUInt8(joystick.joyXbyte); // Joystick X
                let y = data.readUInt8(joystick.joyYbyte); // Joystick Y
                const z = data.readUInt8(joystick.joyZbyte); // Joystick Z (twist of joystick)
                y = -y; // "Up" on the joystick should be positive
                if (y === 0)
                    y = 0; // To deal with negative signed zero
                newAnalogStates.joystick[index] = {
                    x: x < 128 ? x : x - 256,
                    y: y < -128 ? y + 256 : y,
                    z: z, // joystick z is a continuous value that rolls over to 0 after 255
                };
            });
            (_g = this.product.hasTrackball) === null || _g === void 0 ? void 0 : _g.forEach((trackball, index) => {
                const x = 256 * data.readUInt8(trackball.trackXbyte_H) + data.readUInt8(trackball.trackXbyte_L); // Trackball X //Delta X motion,  X ball motion = 256*DELTA_X_H + DELTA_X_L.
                const y = 256 * data.readUInt8(trackball.trackYbyte_H) + data.readUInt8(trackball.trackYbyte_L); // Trackball Y
                newAnalogStates.trackball[index] = {
                    x: x < 32768 ? x : x - 65536,
                    y: y < 32768 ? y : y - 65536, // -32768 to 32768// Trackball Y
                };
            });
            (_h = this.product.hasTbar) === null || _h === void 0 ? void 0 : _h.forEach((tBar, index) => {
                const d = data.readUInt8(tBar.tbarByte); // T-bar (calibrated)
                newAnalogStates.tbar[index] = d;
            });
            (_j = this.product.hasRotary) === null || _j === void 0 ? void 0 : _j.forEach((rotary, index) => {
                const d = data.readUInt8(rotary.rotaryByte);
                newAnalogStates.rotary[index] = d;
            });
            // Disabled/nonexisting buttons: important as some "buttons" in the jog & shuttle devices are used for shuttle events in hardware.
            if (this.product.disableButtons) {
                this.product.disableButtons.forEach((keyIndex) => {
                    newButtonStates.set(keyIndex, false);
                });
            }
            // Compare with previous button states:
            newButtonStates.forEach((buttonState, index) => {
                if ((this._buttonStates.get(index) || false) !== newButtonStates.get(index)) {
                    const btnLocation = this._findBtnLocation(index);
                    const metadata = {
                        row: btnLocation.row,
                        col: btnLocation.col,
                        timestamp: timestamp,
                    };
                    if (buttonState) {
                        // Button is pressed
                        this.emit('down', index, metadata);
                    }
                    else {
                        this.emit('up', index, metadata);
                    }
                }
            });
            const eventMetadata = {
                timestamp: timestamp,
            };
            // Compare with previous analogue states:
            newAnalogStates.jog.forEach((newValue, index) => {
                const oldValue = this._analogStates.jog[index];
                // Special case for jog:
                // The jog emits the delta value followed by it being reset to 0
                // Ignore the 0, since that won't be useful
                if (newValue === 0)
                    return;
                if (newValue !== oldValue)
                    this.emit('jog', index, newValue, eventMetadata);
            });
            newAnalogStates.shuttle.forEach((newValue, index) => {
                const oldValue = this._analogStates.shuttle[index];
                if (newValue !== oldValue)
                    this.emit('shuttle', index, newValue, eventMetadata);
            });
            newAnalogStates.joystick.forEach((newValue, index) => {
                const oldValue = this._analogStates.joystick[index];
                if (!oldValue) {
                    const emitValue = {
                        ...newValue,
                        // Calculate deltaZ, since that is not trivial to do:
                        deltaZ: 0,
                    };
                    this.emit('joystick', index, emitValue, eventMetadata);
                }
                else if (oldValue.x !== newValue.x || oldValue.y !== newValue.y || oldValue.z !== newValue.z) {
                    const emitValue = {
                        ...newValue,
                        // Calculate deltaZ, since that is not trivial to do:
                        deltaZ: XKeys.calculateDelta(newValue.z, oldValue.z),
                    };
                    this.emit('joystick', index, emitValue, eventMetadata);
                }
            });
            newAnalogStates.tbar.forEach((newValue, index) => {
                const oldValue = this._analogStates.tbar[index];
                if (newValue !== oldValue)
                    this.emit('tbar', index, newValue, eventMetadata);
            });
            newAnalogStates.rotary.forEach((newValue, index) => {
                const oldValue = this._analogStates.rotary[index];
                if (newValue !== oldValue)
                    this.emit('rotary', index, newValue, eventMetadata);
            });
            newAnalogStates.trackball.forEach((newValue, index) => {
                // We only need to emit the value when not zero, since the trackball motion are relative values.
                if (newValue.x !== 0 || newValue.y !== 0)
                    this.emit('trackball', index, newValue, eventMetadata);
            });
            // Store the new states:
            this._buttonStates = newButtonStates;
            this._analogStates = newAnalogStates;
        });
        this.device.on('error', (err) => {
            if ((err + '').match(/could not read from/)) {
                // The device has been disconnected
                this._handleDeviceDisconnected().catch((error) => {
                    this.emit('error', error);
                });
            }
            else {
                this.emit('error', err);
            }
        });
        return {
            ...found.product,
            productId: found.productId,
            interface: found.interface,
        };
    }
    /** Initialize the device. This ensures that the essential information from the device about its state has been received. */
    async init() {
        const pReceivedVersion = new Promise((resolve) => {
            this.receivedVersionResolve = resolve;
        });
        const pReceivedGenerateData = new Promise((resolve) => {
            this.receivedGenerateDataResolve = resolve;
        });
        this._getVersion();
        this._generateData();
        await pReceivedVersion;
        await pReceivedGenerateData;
        this._initialized = true;
    }
    /** Closes the device. Subsequent commands will raise errors. */
    async close() {
        await this._handleDeviceDisconnected();
    }
    /** Firmware version of the device */
    get firmwareVersion() {
        return this._firmwareVersion;
    }
    /** Unit id ("UID") of the device, is used to uniquely identify a certain panel, or panel type.
     * From factory it's set to 0, but it can be changed using this.setUnitId()
     */
    get unitId() {
        return this._unitId;
    }
    /** Various information about the device and its capabilities */
    get info() {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        this.ensureInitialized();
        return (0, lib_1.literal)({
            name: this.product.name,
            vendorId: products_1.XKEYS_VENDOR_ID,
            productId: this.product.productId,
            interface: this.product.interface,
            unitId: this.unitId,
            firmwareVersion: this._firmwareVersion,
            colCount: this.product.colCount,
            rowCount: this.product.rowCount,
            layout: ((_a = this.product.layouts) === null || _a === void 0 ? void 0 : _a.map((region) => {
                return (0, lib_1.literal)({
                    name: region[0],
                    index: region[1],
                    startRow: region[2],
                    startCol: region[3],
                    endRow: region[4],
                    endCol: region[5],
                });
            })) || [],
            emitsTimestamp: this.product.timestampByte !== undefined,
            hasPS: this.product.hasPS,
            hasJoystick: ((_b = this.product.hasJoystick) === null || _b === void 0 ? void 0 : _b.length) || 0,
            hasTrackball: ((_c = this.product.hasTrackball) === null || _c === void 0 ? void 0 : _c.length) || 0,
            hasExtraButtons: ((_d = this.product.hasExtraButtons) === null || _d === void 0 ? void 0 : _d.length) || 0,
            hasJog: ((_e = this.product.hasJog) === null || _e === void 0 ? void 0 : _e.length) || 0,
            hasShuttle: ((_f = this.product.hasShuttle) === null || _f === void 0 ? void 0 : _f.length) || 0,
            hasTbar: ((_g = this.product.hasTbar) === null || _g === void 0 ? void 0 : _g.length) || 0,
            hasRotary: ((_h = this.product.hasRotary) === null || _h === void 0 ? void 0 : _h.length) || 0,
            hasLCD: this.product.hasLCD || false,
            hasGPIO: this.product.hasGPIO || false,
            hasSerialData: this.product.hasSerialData || false,
            hasDMX: this.product.hasDMX || false,
        });
    }
    /**
     * Returns an object with current Button states
     */
    getButtons() {
        return new Map(this._buttonStates); // Make a copy
    }
    /**
     * Sets the indicator-LED on the device, usually a red and green LED at the top of many X-keys
     * @param ledIndex the LED to set (1 = green (top), 2 = red (bottom))
     * @param on boolean: on or off
     * @param flashing boolean: flashing or not (if on)
     * @returns undefined
     */
    setIndicatorLED(ledIndex, on, flashing) {
        this.ensureInitialized();
        //force to 6 or 7
        if (ledIndex === 1)
            ledIndex = 6;
        else if (ledIndex === 2)
            ledIndex = 7;
        this._write([0, 179, ledIndex, on ? (flashing ? 2 : 1) : 0]);
    }
    /**
     * Sets the backlight of a button
     * @param keyIndex The button of which to set the backlight color
     * @param color r,g,b or string (RGB, RRGGBB, #RRGGBB)
     * @param bankIndex number: Which LED bank (top or bottom) to set the color of. (Only applicable to RGB-based panels. )
     * @param flashing boolean: flashing or not (if on)
     * @returns undefined
     */
    setBacklight(keyIndex, 
    /** RGB, RRGGBB, #RRGGBB */
    color, flashing, bankIndex) {
        this.ensureInitialized();
        if (keyIndex === 0)
            return; // PS-button has no backlight
        this._verifyButtonIndex(keyIndex);
        color = this._interpretColor(color, this.product.backLightType);
        const location = this._findBtnLocation(keyIndex);
        if (this.product.backLightType === products_1.BackLightType.REMAP_24) {
            // obsolete, Consider removing MHH
            const ledIndex = (location.col - 1) * 8 + location.row - 1;
            // backlight LED type 5 is the RGB 24 buttons
            this._write([0, 181, ledIndex, color.g, color.r, color.b, flashing ? 1 : 0]); // Byte order is actually G,R,B,F)
        }
        else if (this.product.backLightType === products_1.BackLightType.RGBx2) {
            // backlight LED type 6, 2 banks of full RGB LEDs
            const ledIndex = keyIndex - 1; // 0 based linear numbering sort of...
            if (bankIndex !== undefined) {
                this._write([0, 165, ledIndex, bankIndex, color.r, color.g, color.b, flashing ? 1 : 0]);
            }
            else {
                // There are  2 leds in under a key, 0 for top and 1 for bottom.
                this._write([0, 165, ledIndex, 0, color.r, color.g, color.b, flashing ? 1 : 0]);
                this._write([0, 165, ledIndex, 1, color.r, color.g, color.b, flashing ? 1 : 0]);
            }
        }
        else if (this.product.backLightType === products_1.BackLightType.STICK_BUTTONS) {
            // The stick buttons, that requires special mapping.
            let ledIndex = location.col - 1; // 0 based linear numbering sort of...
            if (ledIndex > 11)
                ledIndex = ledIndex + 4;
            else if (ledIndex > 5)
                ledIndex = ledIndex + 2;
            const on = color.r > 0 || color.g > 0 || color.b > 0;
            this._write([0, 181, ledIndex, on ? (flashing ? 2 : 1) : 0, 1]);
        }
        else if (this.product.backLightType === products_1.BackLightType.LINEAR) {
            // The 40 buttons, that requires special mapping.
            const ledIndex = keyIndex - 1; // 0 based linear numbering sort of...
            const on = color.r > 0 || color.g > 0 || color.b > 0;
            this._write([0, 181, ledIndex, on ? (flashing ? 2 : 1) : 0, 1]);
        }
        else if (this.product.backLightType === products_1.BackLightType.LEGACY) {
            const ledIndexBlue = (location.col - 1) * 8 + location.row - 1;
            const ledIndexRed = ledIndexBlue + (this.product.backLight2offset || 0);
            // Blue LED:
            this._write([0, 181, ledIndexBlue, color.b > 0 ? (flashing ? 2 : 1) : 0, 1]);
            // Red LED:
            this._write([0, 181, ledIndexRed, color.r > 0 || color.g > 0 ? (flashing ? 2 : 1) : 0, 1]);
        }
        else if (this.product.backLightType === products_1.BackLightType.NONE) {
            // No backlight, do nothing
        }
    }
    /**
     * Sets the backlight of all buttons
     * @param color r,g,b or string (RGB, RRGGBB, #RRGGBB)
     * @param bankIndex number: Which LED bank (top or bottom) to control.
     */
    setAllBacklights(color, bankIndex) {
        this.ensureInitialized();
        color = this._interpretColor(color, this.product.backLightType);
        if (this.product.backLightType === products_1.BackLightType.RGBx2) {
            // backlight LED type 6 is the RGB devices
            if (bankIndex !== undefined) {
                this._write([0, 166, bankIndex, color.r, color.g, color.b]);
            }
            else {
                // There are  2 leds in under a key, 0 for top and 1 for bottom.
                this._write([0, 166, 0, color.r, color.g, color.b]);
                this._write([0, 166, 1, color.r, color.g, color.b]);
            }
        }
        else {
            // Blue LEDs:
            this._write([0, 182, 0, color.b]);
            // Red LEDs:
            this._write([0, 182, 1, color.r || color.g]);
        }
    }
    /**
     * On first call: Turn all backlights off
     * On second call: Return all backlights to their previous states
     */
    toggleAllBacklights() {
        this.ensureInitialized();
        this._write([0, 184]);
    }
    /**
     * Sets the backlightintensity of the device
     * @param blueIntensity 0-255
     * @param redIntensity 0-255
     */
    setBacklightIntensity(blueIntensity, redIntensity) {
        this.ensureInitialized();
        if (redIntensity === undefined)
            redIntensity = blueIntensity;
        blueIntensity = Math.max(Math.min(blueIntensity, 255), 0);
        redIntensity = Math.max(Math.min(redIntensity, 255), 0);
        if (this.product.backLightType === 2) {
            this._write([0, 187, blueIntensity, redIntensity]);
        }
        else {
            this._write([0, 187, blueIntensity]);
        }
    }
    /**
     * Save the current backlights. This will restore the backlights after a power cycle.
     * Note: EEPROM command, don't call this function too often, or you'll kill the EEPROM!
     * (An EEPROM only support a few thousands of write operations.)
     */
    saveBackLights() {
        this.ensureInitialized();
        this._write([0, 199, 1]);
    }
    /**
     * Sets the flash frequency of LEDs for the entire X-keys. Flashing will always be synchronized
     * @param frequency 1-255, where 1 is fastest and 255 is the slowest. 255 is approximately 4 seconds between flashes.
     * @returns undefined
     */
    setFrequency(frequency) {
        this.ensureInitialized();
        if (!(frequency >= 1 && frequency <= 255)) {
            throw new Error(`Invalid frequency: ${frequency}`);
        }
        this._write([0, 180, frequency]);
    }
    /**
     * Sets the UID (unit Id) value in the X-keys hardware
     * Note: EEPROM command, don't call this function too often, or you'll kill the EEPROM!
     * (An EEPROM only supports a few thousands of write operations.)
     * @param unitId Unit id ("UID"). Allowed values: 0-255. 0 is factory default
     * @returns undefined
     */
    setUnitId(unitId) {
        this.ensureInitialized();
        if (!(unitId >= 0 && unitId <= 255)) {
            throw new Error(`Invalid UID: ${unitId} (needs to be between 0 - 255)`);
        }
        this._write([0, 189, unitId]);
        this._unitId = unitId;
    }
    /**
     * Reboots the device
     * @returns undefined
     */
    rebootDevice() {
        this.ensureInitialized();
        this._write([0, 238]);
    }
    /**
     * Sets the 2x16 LCD display
     * @param line  1 for top line, 2 for bottom line.
     * @param displayChar // string to display, empty string to clear
     * @param backlight  0 for off, 1 for on.
     * @returns undefined
     */
    writeLcdDisplay(line, displayChar, backlight) {
        this.ensureInitialized();
        if (!this.product.hasLCD)
            return; // only used for LCD display devices.
        const byteVals = [0, 206, 0, 1, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32]; // load the array with 206 op code and spaces
        // change line number to 0 or 1 and set line # byte
        if (line < 2)
            line = 0;
        if (line > 1)
            line = 1;
        byteVals[2] = line;
        // change backlight to 0 or 1 and set backlight byte
        let liteByte;
        if (backlight) {
            liteByte = 1;
        }
        else {
            liteByte = 0;
        }
        byteVals[3] = liteByte; // set the LCD backlight on or off.
        // loop through the string and load array with ascii byte values
        let i;
        for (i = 0; i < displayChar.length; i++) {
            byteVals[i + 4] = displayChar.charCodeAt(i);
            if (i > 15)
                break; // quit at 16 chars
        }
        this._write(byteVals);
    }
    /**
     * Writes a Buffer of data bytes to the X-keys device
     * Used to send custom messages to X-keys for testing and development, see documentation for valid messages
     * @param buffer The buffer written to the device
     * @returns undefined
     */
    writeData(message) {
        this._write(message);
    }
    /** (Internal function) Called when there has been detected that the device has been disconnected */
    async _handleDeviceDisconnected() {
        if (!this._disconnected) {
            this._disconnected = true;
            await this.device.close();
            this.emit('disconnected');
        }
    }
    /** (Internal function) Called when there has been detected that a device has been reconnected */
    async _handleDeviceReconnected(device, deviceInfo) {
        if (this._disconnected) {
            this._disconnected = false;
            // Re-vitalize:
            this.device = device;
            this.product = this._setupDevice(deviceInfo);
            await this.init();
            this.emit('reconnected');
        }
    }
    _getHIDDevice() {
        return this.device;
    }
    _getDeviceInfo() {
        return this.deviceInfo;
    }
    get devicePath() {
        return this._devicePath;
    }
    /** The unique id of the xkeys-panel. Note: This is only available if options.automaticUnitIdMode is set for the Watcher */
    get uniqueId() {
        return `${this.info.productId}_${this.unitId}`;
    }
    /**
     * Writes a Buffer to the X-keys device
     *
     * @param buffer The buffer written to the device
     * @returns undefined
     */
    _write(message) {
        if (this._disconnected)
            throw new Error('X-keys panel has been disconnected');
        message = this._padMessage(message);
        const intArray = [];
        for (let index = 0; index < message.length; index++) {
            const value = message[index];
            intArray[index] = typeof value === 'string' ? parseInt(value, 10) : value;
        }
        try {
            this.device.write(intArray);
        }
        catch (e) {
            this.emit('error', e);
        }
    }
    _padMessage(message) {
        const messageLength = 36;
        while (message.length < messageLength) {
            message.push(0);
        }
        return message;
    }
    _verifyButtonIndex(keyIndex) {
        if (!(keyIndex >= 0 && keyIndex < 8 * this.product.bBytes + 1)) {
            throw new Error(`Invalid keyIndex: ${keyIndex}`);
        }
    }
    _findBtnLocation(keyIndex) {
        let location = { row: 0, col: 0 };
        // derive the Row and Column from the button index for many products
        if (keyIndex !== 0) {
            // program switch is always on index 0 and always R:0, C:0 unless remapped by btnLocaion array
            location.row = keyIndex - this.product.bBits * (Math.ceil(keyIndex / this.product.bBits) - 1);
            location.col = Math.ceil(keyIndex / this.product.bBits);
        }
        // if the product has a btnLocaion array, then look up the Row and Column
        if (this.product.btnLocation !== undefined) {
            location = {
                row: this.product.btnLocation[keyIndex][0],
                col: this.product.btnLocation[keyIndex][1],
            };
        }
        return location;
    }
    /**
     * Generate data: forces the unit to send a data report with current states. Important to get the Unit ID.
     * @param none
     * @returns undefined //an input report will be generated by the X-keys with bit 2 of PS set. This is useful in determining the initial state of the device before any data has changed.
     */
    _generateData() {
        this._write([0, 177]);
    }
    /**
     * Gets the firmware version and UID : forces the unit to send a special data report with firmware version and Unit ID.
     * @param none
     * @returns undefined //an input report will be generated by the X-keys with byte 2 set to 214. This has the firmware version and UID.
     */
    _getVersion() {
        this._write([0, 214]);
    }
    /** Makes best effort to interpret a color */
    _interpretColor(color, _backLightType) {
        if (typeof color === 'boolean' || color === null) {
            // todo: Should we use _backLightType in some way to determine different default colors?
            if (color)
                return { r: 0, g: 0, b: 255 };
            else
                return { r: 0, g: 0, b: 0 };
        }
        else if (typeof color === 'string') {
            // Note: Handle a few "worded" colors, these colors are tweaked to look nice with the X-keys LEDs:
            if (color === 'red')
                color = 'ff0000';
            else if (color === 'blue')
                color = '0000ff';
            else if (color === 'violet')
                color = '600096';
            else if (color === 'aquamarine')
                color = '00ff45';
            else if (color === 'turquoise')
                color = '00ff81';
            else if (color === 'purple')
                color = '960096';
            else if (color === 'redblue')
                color = 'ff00ff';
            else if (color === 'pink')
                color = 'ff0828';
            else if (color === 'orange')
                color = 'ff1400';
            else if (color === 'yellow')
                color = 'ff8000';
            else if (color === 'green')
                color = '00ff00';
            else if (color === 'black')
                color = '000000';
            else if (color === 'white')
                color = 'ffffff';
            else if (color === 'on')
                color = 'ffffff';
            else if (color === 'off')
                color = '000000';
            let m;
            if ((m = color.match(/([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})/))) {
                // 'RRGGBB'
                return {
                    r: parseInt(m[1], 16),
                    g: parseInt(m[2], 16),
                    b: parseInt(m[3], 16),
                };
            }
            else if ((m = color.match(/([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})/))) {
                // 'RGB'
                return {
                    r: parseInt(m[1] + m[1], 16),
                    g: parseInt(m[2] + m[2], 16),
                    b: parseInt(m[3] + m[3], 16),
                };
            }
            else if ((m = color.match(/([0-9]{1,3}),([0-9]{1,3}),([0-9]{1,3})/))) {
                // '255,127,0' // comma separated integers
                return {
                    r: parseInt(m[1], 10),
                    g: parseInt(m[2], 10),
                    b: parseInt(m[3], 10),
                };
            }
            else {
                // Fallback:
                this.emit('error', new Error(`Unable to interpret color "${color}"`));
                return {
                    r: 127,
                    g: 127,
                    b: 127,
                };
            }
        }
        else {
            return color;
        }
    }
    /** Check that the .init() function has run, throw otherwise */
    ensureInitialized() {
        if (!this._initialized)
            throw new Error('XKeys.init() must be run first!');
    }
    /** Calculate delta value */
    static calculateDelta(newValue, oldValue, overflow = 256) {
        let delta = newValue - oldValue;
        if (delta < -overflow * 0.5)
            delta += overflow; // Deal with when the new value overflows
        if (delta > overflow * 0.5)
            delta -= overflow; // Deal with when the new value underflows
        return delta;
    }
}
exports.XKeys = XKeys;
//# sourceMappingURL=xkeys.js.map

/***/ }),

/***/ 415:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
__exportStar(__webpack_require__(613), exports);
__exportStar(__webpack_require__(901), exports);
__exportStar(__webpack_require__(812), exports);
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 812:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.setupXkeysPanel = exports.getOpenedXKeysPanels = exports.requestXkeysPanels = void 0;
const core_1 = __webpack_require__(613);
const web_hid_wrapper_1 = __webpack_require__(901);
/** Prompts the user for which X-keys panel to select */
async function requestXkeysPanels() {
    const allDevices = await navigator.hid.requestDevice({
        filters: [
            {
                vendorId: core_1.XKEYS_VENDOR_ID,
            },
        ],
    });
    return allDevices.filter(isValidXkeysUsage);
}
exports.requestXkeysPanels = requestXkeysPanels;
/**
 * Reopen previously selected devices.
 * The browser remembers what the user previously allowed your site to access, and this will open those without the request dialog
 */
async function getOpenedXKeysPanels() {
    const allDevices = await navigator.hid.getDevices();
    return allDevices.filter(isValidXkeysUsage);
}
exports.getOpenedXKeysPanels = getOpenedXKeysPanels;
function isValidXkeysUsage(device) {
    if (device.vendorId !== core_1.XKEYS_VENDOR_ID)
        return false;
    return !!device.collections.find((collection) => {
        var _a;
        if (collection.usagePage !== 12)
            return false;
        // Check the write-length of the device is > 20
        return !!((_a = collection.outputReports) === null || _a === void 0 ? void 0 : _a.find((report) => { var _a; return !!((_a = report.items) === null || _a === void 0 ? void 0 : _a.find((item) => { var _a; return (_a = item.reportCount) !== null && _a !== void 0 ? _a : 0 > 20; })); }));
    });
}
/** Sets up a connection to a HID device (the X-keys panel) */
async function setupXkeysPanel(browserDevice) {
    var _a;
    if (!((_a = browserDevice === null || browserDevice === void 0 ? void 0 : browserDevice.collections) === null || _a === void 0 ? void 0 : _a.length))
        throw Error(`device collections is empty`);
    if (!isValidXkeysUsage(browserDevice))
        throw new Error(`Device has incorrect usage/interface`);
    if (!browserDevice.productId)
        throw Error(`Device has no productId!`);
    const productId = browserDevice.productId;
    if (!browserDevice.opened) {
        await browserDevice.open();
    }
    const deviceWrap = new web_hid_wrapper_1.WebHIDDevice(browserDevice);
    const xkeys = new core_1.XKeys(deviceWrap, {
        product: browserDevice.productName,
        productId: productId,
        interface: null, // todo: Check what to use here (collection.usage?)
    }, undefined);
    // Wait for the device to initialize:
    try {
        await xkeys.init();
        return xkeys;
    }
    catch (e) {
        await deviceWrap.close();
        throw e;
    }
}
exports.setupXkeysPanel = setupXkeysPanel;
//# sourceMappingURL=methods.js.map

/***/ }),

/***/ 901:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WebHIDDevice = void 0;
const events_1 = __webpack_require__(531);
const p_queue_1 = __webpack_require__(10);
const buffer_1 = __webpack_require__(324);
/**
 * The wrapped browser HIDDevice.
 * This translates it into the common format (@see CoreHIDDevice) defined by @xkeys-lib/core
 */
class WebHIDDevice extends events_1.EventEmitter {
    constructor(device) {
        super();
        this.reportQueue = new p_queue_1.default({ concurrency: 1 });
        this._handleInputreport = this._handleInputreport.bind(this);
        this._handleError = this._handleError.bind(this);
        this.device = device;
        this.device.addEventListener('inputreport', this._handleInputreport);
        this.device.addEventListener('error', this._handleError);
    }
    write(data) {
        this.reportQueue
            .add(async () => {
            await this.device.sendReport(data[0], new Uint8Array(data.slice(1)));
        })
            .catch((err) => {
            this.emit('error', err);
        });
    }
    async close() {
        await this.device.close();
        this.device.removeEventListener('inputreport', this._handleInputreport.bind(this));
    }
    _handleInputreport(event) {
        const buf = buffer_1.Buffer.from(event.data.buffer);
        this.emit('data', buf);
    }
    _handleError(error) {
        this.emit('error', error);
    }
}
exports.WebHIDDevice = WebHIDDevice;
//# sourceMappingURL=web-hid-wrapper.js.map

/***/ }),

/***/ 324:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */



const base64 = __webpack_require__(277)
const ieee754 = __webpack_require__(608)
const customInspectSymbol =
  (typeof Symbol === 'function' && typeof Symbol['for'] === 'function') // eslint-disable-line dot-notation
    ? Symbol['for']('nodejs.util.inspect.custom') // eslint-disable-line dot-notation
    : null

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

const K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    const arr = new Uint8Array(1)
    const proto = { foo: function () { return 42 } }
    Object.setPrototypeOf(proto, Uint8Array.prototype)
    Object.setPrototypeOf(arr, proto)
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  const buf = new Uint8Array(length)
  Object.setPrototypeOf(buf, Buffer.prototype)
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayView(value)
  }

  if (value == null) {
    throw new TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof SharedArrayBuffer !== 'undefined' &&
      (isInstance(value, SharedArrayBuffer) ||
      (value && isInstance(value.buffer, SharedArrayBuffer)))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  const valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  const b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(value[Symbol.toPrimitive]('string'), encodingOrOffset, length)
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Object.setPrototypeOf(Buffer.prototype, Uint8Array.prototype)
Object.setPrototypeOf(Buffer, Uint8Array)

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpreted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  const length = byteLength(string, encoding) | 0
  let buf = createBuffer(length)

  const actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  const length = array.length < 0 ? 0 : checked(array.length) | 0
  const buf = createBuffer(length)
  for (let i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayView (arrayView) {
  if (isInstance(arrayView, Uint8Array)) {
    const copy = new Uint8Array(arrayView)
    return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength)
  }
  return fromArrayLike(arrayView)
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  let buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  Object.setPrototypeOf(buf, Buffer.prototype)

  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    const len = checked(obj.length) | 0
    const buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  let x = a.length
  let y = b.length

  for (let i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  let i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  const buffer = Buffer.allocUnsafe(length)
  let pos = 0
  for (i = 0; i < list.length; ++i) {
    let buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      if (pos + buf.length > buffer.length) {
        if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf)
        buf.copy(buffer, pos)
      } else {
        Uint8Array.prototype.set.call(
          buffer,
          buf,
          pos
        )
      }
    } else if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    } else {
      buf.copy(buffer, pos)
    }
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  const len = string.length
  const mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  let loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  let loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coercion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  const i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  const len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (let i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  const len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (let i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  const len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (let i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  const length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  let str = ''
  const max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}
if (customInspectSymbol) {
  Buffer.prototype[customInspectSymbol] = Buffer.prototype.inspect
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  let x = thisEnd - thisStart
  let y = end - start
  const len = Math.min(x, y)

  const thisCopy = this.slice(thisStart, thisEnd)
  const targetCopy = target.slice(start, end)

  for (let i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [val], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  let indexSize = 1
  let arrLength = arr.length
  let valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  let i
  if (dir) {
    let foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      let found = true
      for (let j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  const remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  const strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  let i
  for (i = 0; i < length; ++i) {
    const parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  const remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  let loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
      case 'latin1':
      case 'binary':
        return asciiWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  const res = []

  let i = start
  while (i < end) {
    const firstByte = buf[i]
    let codePoint = null
    let bytesPerSequence = (firstByte > 0xEF)
      ? 4
      : (firstByte > 0xDF)
          ? 3
          : (firstByte > 0xBF)
              ? 2
              : 1

    if (i + bytesPerSequence <= end) {
      let secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
const MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  const len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  let res = ''
  let i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  let ret = ''
  end = Math.min(buf.length, end)

  for (let i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  let ret = ''
  end = Math.min(buf.length, end)

  for (let i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  const len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  let out = ''
  for (let i = start; i < end; ++i) {
    out += hexSliceLookupTable[buf[i]]
  }
  return out
}

function utf16leSlice (buf, start, end) {
  const bytes = buf.slice(start, end)
  let res = ''
  // If bytes.length is odd, the last 8 bits must be ignored (same as node.js)
  for (let i = 0; i < bytes.length - 1; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  const len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  const newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  Object.setPrototypeOf(newBuf, Buffer.prototype)

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUintLE =
Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  let val = this[offset]
  let mul = 1
  let i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUintBE =
Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  let val = this[offset + --byteLength]
  let mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUint8 =
Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUint16LE =
Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUint16BE =
Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUint32LE =
Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUint32BE =
Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readBigUInt64LE = defineBigIntMethod(function readBigUInt64LE (offset) {
  offset = offset >>> 0
  validateNumber(offset, 'offset')
  const first = this[offset]
  const last = this[offset + 7]
  if (first === undefined || last === undefined) {
    boundsError(offset, this.length - 8)
  }

  const lo = first +
    this[++offset] * 2 ** 8 +
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 24

  const hi = this[++offset] +
    this[++offset] * 2 ** 8 +
    this[++offset] * 2 ** 16 +
    last * 2 ** 24

  return BigInt(lo) + (BigInt(hi) << BigInt(32))
})

Buffer.prototype.readBigUInt64BE = defineBigIntMethod(function readBigUInt64BE (offset) {
  offset = offset >>> 0
  validateNumber(offset, 'offset')
  const first = this[offset]
  const last = this[offset + 7]
  if (first === undefined || last === undefined) {
    boundsError(offset, this.length - 8)
  }

  const hi = first * 2 ** 24 +
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 8 +
    this[++offset]

  const lo = this[++offset] * 2 ** 24 +
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 8 +
    last

  return (BigInt(hi) << BigInt(32)) + BigInt(lo)
})

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  let val = this[offset]
  let mul = 1
  let i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  let i = byteLength
  let mul = 1
  let val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  const val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  const val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readBigInt64LE = defineBigIntMethod(function readBigInt64LE (offset) {
  offset = offset >>> 0
  validateNumber(offset, 'offset')
  const first = this[offset]
  const last = this[offset + 7]
  if (first === undefined || last === undefined) {
    boundsError(offset, this.length - 8)
  }

  const val = this[offset + 4] +
    this[offset + 5] * 2 ** 8 +
    this[offset + 6] * 2 ** 16 +
    (last << 24) // Overflow

  return (BigInt(val) << BigInt(32)) +
    BigInt(first +
    this[++offset] * 2 ** 8 +
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 24)
})

Buffer.prototype.readBigInt64BE = defineBigIntMethod(function readBigInt64BE (offset) {
  offset = offset >>> 0
  validateNumber(offset, 'offset')
  const first = this[offset]
  const last = this[offset + 7]
  if (first === undefined || last === undefined) {
    boundsError(offset, this.length - 8)
  }

  const val = (first << 24) + // Overflow
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 8 +
    this[++offset]

  return (BigInt(val) << BigInt(32)) +
    BigInt(this[++offset] * 2 ** 24 +
    this[++offset] * 2 ** 16 +
    this[++offset] * 2 ** 8 +
    last)
})

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUintLE =
Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    const maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  let mul = 1
  let i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUintBE =
Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    const maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  let i = byteLength - 1
  let mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUint8 =
Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUint16LE =
Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUint16BE =
Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUint32LE =
Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUint32BE =
Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function wrtBigUInt64LE (buf, value, offset, min, max) {
  checkIntBI(value, min, max, buf, offset, 7)

  let lo = Number(value & BigInt(0xffffffff))
  buf[offset++] = lo
  lo = lo >> 8
  buf[offset++] = lo
  lo = lo >> 8
  buf[offset++] = lo
  lo = lo >> 8
  buf[offset++] = lo
  let hi = Number(value >> BigInt(32) & BigInt(0xffffffff))
  buf[offset++] = hi
  hi = hi >> 8
  buf[offset++] = hi
  hi = hi >> 8
  buf[offset++] = hi
  hi = hi >> 8
  buf[offset++] = hi
  return offset
}

function wrtBigUInt64BE (buf, value, offset, min, max) {
  checkIntBI(value, min, max, buf, offset, 7)

  let lo = Number(value & BigInt(0xffffffff))
  buf[offset + 7] = lo
  lo = lo >> 8
  buf[offset + 6] = lo
  lo = lo >> 8
  buf[offset + 5] = lo
  lo = lo >> 8
  buf[offset + 4] = lo
  let hi = Number(value >> BigInt(32) & BigInt(0xffffffff))
  buf[offset + 3] = hi
  hi = hi >> 8
  buf[offset + 2] = hi
  hi = hi >> 8
  buf[offset + 1] = hi
  hi = hi >> 8
  buf[offset] = hi
  return offset + 8
}

Buffer.prototype.writeBigUInt64LE = defineBigIntMethod(function writeBigUInt64LE (value, offset = 0) {
  return wrtBigUInt64LE(this, value, offset, BigInt(0), BigInt('0xffffffffffffffff'))
})

Buffer.prototype.writeBigUInt64BE = defineBigIntMethod(function writeBigUInt64BE (value, offset = 0) {
  return wrtBigUInt64BE(this, value, offset, BigInt(0), BigInt('0xffffffffffffffff'))
})

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    const limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  let i = 0
  let mul = 1
  let sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    const limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  let i = byteLength - 1
  let mul = 1
  let sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeBigInt64LE = defineBigIntMethod(function writeBigInt64LE (value, offset = 0) {
  return wrtBigUInt64LE(this, value, offset, -BigInt('0x8000000000000000'), BigInt('0x7fffffffffffffff'))
})

Buffer.prototype.writeBigInt64BE = defineBigIntMethod(function writeBigInt64BE (value, offset = 0) {
  return wrtBigUInt64BE(this, value, offset, -BigInt('0x8000000000000000'), BigInt('0x7fffffffffffffff'))
})

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  const len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      const code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  } else if (typeof val === 'boolean') {
    val = Number(val)
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  let i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    const bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    const len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// CUSTOM ERRORS
// =============

// Simplified versions from Node, changed for Buffer-only usage
const errors = {}
function E (sym, getMessage, Base) {
  errors[sym] = class NodeError extends Base {
    constructor () {
      super()

      Object.defineProperty(this, 'message', {
        value: getMessage.apply(this, arguments),
        writable: true,
        configurable: true
      })

      // Add the error code to the name to include it in the stack trace.
      this.name = `${this.name} [${sym}]`
      // Access the stack to generate the error message including the error code
      // from the name.
      this.stack // eslint-disable-line no-unused-expressions
      // Reset the name to the actual name.
      delete this.name
    }

    get code () {
      return sym
    }

    set code (value) {
      Object.defineProperty(this, 'code', {
        configurable: true,
        enumerable: true,
        value,
        writable: true
      })
    }

    toString () {
      return `${this.name} [${sym}]: ${this.message}`
    }
  }
}

E('ERR_BUFFER_OUT_OF_BOUNDS',
  function (name) {
    if (name) {
      return `${name} is outside of buffer bounds`
    }

    return 'Attempt to access memory outside buffer bounds'
  }, RangeError)
E('ERR_INVALID_ARG_TYPE',
  function (name, actual) {
    return `The "${name}" argument must be of type number. Received type ${typeof actual}`
  }, TypeError)
E('ERR_OUT_OF_RANGE',
  function (str, range, input) {
    let msg = `The value of "${str}" is out of range.`
    let received = input
    if (Number.isInteger(input) && Math.abs(input) > 2 ** 32) {
      received = addNumericalSeparator(String(input))
    } else if (typeof input === 'bigint') {
      received = String(input)
      if (input > BigInt(2) ** BigInt(32) || input < -(BigInt(2) ** BigInt(32))) {
        received = addNumericalSeparator(received)
      }
      received += 'n'
    }
    msg += ` It must be ${range}. Received ${received}`
    return msg
  }, RangeError)

function addNumericalSeparator (val) {
  let res = ''
  let i = val.length
  const start = val[0] === '-' ? 1 : 0
  for (; i >= start + 4; i -= 3) {
    res = `_${val.slice(i - 3, i)}${res}`
  }
  return `${val.slice(0, i)}${res}`
}

// CHECK FUNCTIONS
// ===============

function checkBounds (buf, offset, byteLength) {
  validateNumber(offset, 'offset')
  if (buf[offset] === undefined || buf[offset + byteLength] === undefined) {
    boundsError(offset, buf.length - (byteLength + 1))
  }
}

function checkIntBI (value, min, max, buf, offset, byteLength) {
  if (value > max || value < min) {
    const n = typeof min === 'bigint' ? 'n' : ''
    let range
    if (byteLength > 3) {
      if (min === 0 || min === BigInt(0)) {
        range = `>= 0${n} and < 2${n} ** ${(byteLength + 1) * 8}${n}`
      } else {
        range = `>= -(2${n} ** ${(byteLength + 1) * 8 - 1}${n}) and < 2 ** ` +
                `${(byteLength + 1) * 8 - 1}${n}`
      }
    } else {
      range = `>= ${min}${n} and <= ${max}${n}`
    }
    throw new errors.ERR_OUT_OF_RANGE('value', range, value)
  }
  checkBounds(buf, offset, byteLength)
}

function validateNumber (value, name) {
  if (typeof value !== 'number') {
    throw new errors.ERR_INVALID_ARG_TYPE(name, 'number', value)
  }
}

function boundsError (value, length, type) {
  if (Math.floor(value) !== value) {
    validateNumber(value, type)
    throw new errors.ERR_OUT_OF_RANGE(type || 'offset', 'an integer', value)
  }

  if (length < 0) {
    throw new errors.ERR_BUFFER_OUT_OF_BOUNDS()
  }

  throw new errors.ERR_OUT_OF_RANGE(type || 'offset',
                                    `>= ${type ? 1 : 0} and <= ${length}`,
                                    value)
}

// HELPER FUNCTIONS
// ================

const INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  let codePoint
  const length = string.length
  let leadSurrogate = null
  const bytes = []

  for (let i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  const byteArray = []
  for (let i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  let c, hi, lo
  const byteArray = []
  for (let i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  let i
  for (i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

// Create lookup table for `toString('hex')`
// See: https://github.com/feross/buffer/issues/219
const hexSliceLookupTable = (function () {
  const alphabet = '0123456789abcdef'
  const table = new Array(256)
  for (let i = 0; i < 16; ++i) {
    const i16 = i * 16
    for (let j = 0; j < 16; ++j) {
      table[i16 + j] = alphabet[i] + alphabet[j]
    }
  }
  return table
})()

// Return not function with Error if BigInt not supported
function defineBigIntMethod (fn) {
  return typeof BigInt === 'undefined' ? BufferBigIntNotDefined : fn
}

function BufferBigIntNotDefined () {
  throw new Error('BigInt not supported')
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
var exports = __webpack_exports__;
var __webpack_unused_export__;

__webpack_unused_export__ = ({ value: true });
const xkeys_webhid_1 = __webpack_require__(415);
function appendLog(str) {
    const logElm = document.getElementById('log');
    if (logElm) {
        logElm.textContent = `${str}\n${logElm.textContent}`;
    }
}
let currentXkeys = null;
async function openDevice(device) {
    const xkeys = await (0, xkeys_webhid_1.setupXkeysPanel)(device);
    currentXkeys = xkeys;
    appendLog(`Connected to "${xkeys.info.name}"`);
    xkeys.on('down', (keyIndex) => {
        appendLog(`Button ${keyIndex} down`);
        xkeys.setBacklight(keyIndex, 'blue');
    });
    xkeys.on('up', (keyIndex) => {
        appendLog(`Button ${keyIndex} up`);
        xkeys.setBacklight(keyIndex, null);
    });
    xkeys.on('jog', (index, value) => {
        appendLog(`Jog #${index}: ${value}`);
    });
    xkeys.on('joystick', (index, value) => {
        appendLog(`Joystick #${index}: ${JSON.stringify(value)}`);
    });
    xkeys.on('shuttle', (index, value) => {
        appendLog(`Shuttle #${index}: ${value}`);
    });
    xkeys.on('tbar', (index, value) => {
        appendLog(`T-bar #${index}: ${value}`);
    });
}
window.addEventListener('load', () => {
    appendLog('Page loaded');
    // Attempt to open a previously selected device:
    (0, xkeys_webhid_1.getOpenedXKeysPanels)()
        .then((devices) => {
        if (devices.length > 0) {
            appendLog(`"${devices[0].productName}" already granted in a previous session`);
            console.log(devices[0]);
            openDevice(devices[0]).catch(console.error);
        }
    })
        .catch(console.error);
});
const consentButton = document.getElementById('consent-button');
consentButton === null || consentButton === void 0 ? void 0 : consentButton.addEventListener('click', () => {
    if (currentXkeys) {
        appendLog('Closing device');
        currentXkeys.close().catch(console.error);
        currentXkeys = null;
    }
    // Prompt for a device
    appendLog('Asking user for permissions...');
    (0, xkeys_webhid_1.requestXkeysPanels)()
        .then((devices) => {
        if (devices.length === 0) {
            appendLog('No device was selected');
            return;
        }
        appendLog(`Access granted to "${devices[0].productName}"`);
        openDevice(devices[0]).catch(console.error);
    })
        .catch((error) => {
        appendLog(`No device access granted: ${error}`);
    });
});
const closeButton = document.getElementById('close-button');
closeButton === null || closeButton === void 0 ? void 0 : closeButton.addEventListener('click', () => {
    if (currentXkeys) {
        appendLog('Closing device');
        currentXkeys.close().catch(console.error);
        currentXkeys = null;
    }
});

})();

/******/ })()
;
//# sourceMappingURL=main.map