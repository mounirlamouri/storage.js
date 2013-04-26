/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

/**
 * This file defines an asynchronous version of the localStorage API, backed by
 * an IndexedDB database.  It creates a global storage object that has methods
 * like the localStorage object.
 *
 * To store a value use set:
 *
 *   storage.set('key', 'value');
 *
 * If you want confirmation that the value has been stored, pass a callback
 * function as the third argument:
 *
 *  storage.set('key', 'newvalue', function() {
 *    console.log('new value stored');
 *  });
 *
 * To read a value, call get(), but note that you must supply a callback
 * function that the value will be passed to asynchronously:
 *
 *  storage.get('key', function(value) {
 *    console.log('The value of key is:', value);
 *  });
 *
 * Note that unlike localStorage, storage does not allow you to store and
 * retrieve values by setting and querying properties directly. You cannot just
 * write storage.key; you have to explicitly call set() or get().
 *
 * remove(), clear(), length(), and key() are like the same-named methods of
 * localStorage, but, like get() and set() they take a callback
 * argument.
 *
 * The asynchronous nature of get() makes it tricky to retrieve multiple
 * values. But unlike localStorage, storage does not require the values you
 * store to be strings.  So if you need to save multiple values and want to
 * retrieve them together, in a single asynchronous operation, just group the
 * values into a single object. The properties of this object may not include
 * DOM elements, but they may include things like Blobs and typed arrays.
 *
 * Unit tests are in test.html
 */

var DEBUG = false;

function _error(msg) {
  if (DEBUG == true) {
    console.error(msg);
  }
}

function IDBStorage() {
  var DBNAME = 'storage_js';
  var DBVERSION = 1;
  var STORENAME = 'keyvaluepairs';
  var db = null;

  function withStore(type, f) {
    if (db) {
      f(db.transaction(STORENAME, type).objectStore(STORENAME));
    } else {
      var openreq = indexedDB.open(DBNAME, DBVERSION);
      openreq.onerror = function withStoreOnError() {
        _error("storage.js: can't open database:" + openreq.error.name);
      };
      openreq.onupgradeneeded = function withStoreOnUpgradeNeeded() {
        // First time setup: create an empty object store
        openreq.result.createObjectStore(STORENAME);
      };
      openreq.onsuccess = function withStoreOnSuccess() {
        db = openreq.result;
        f(db.transaction(STORENAME, type).objectStore(STORENAME));
      };
    }
  }

  function get(key, callback) {
    withStore('readonly', function getBody(store) {
      var req = store.get(key);
      req.onsuccess = function getOnSuccess() {
        var value = req.result;
        if (value === undefined)
          value = null;
        setTimeout(function() { callback(value); }, 0);
      };
      req.onerror = function getOnError() {
        _error('Error in storage.get(): ' + req.error.name);
      };
    });
  }

  function set(key, value, callback) {
    // IE10 has a bug and miserably fails when store.put(null, key) is called.
    if (value == null) {
      return remove(key, callback);
    }
    withStore('readwrite', function setmBody(store) {
      var req = store.put(value, key);
      if (callback) {
        req.onsuccess = function setOnSuccess() {
          setTimeout(callback, 0);
        };
      }
      req.onerror = function setOnError() {
        _error('Error in storage.set(): ' + req.error.name);
      };
    });
  }

  function remove(key, callback) {
    withStore('readwrite', function removeBody(store) {
      var req = store['delete'](key);
      if (callback) {
        req.onsuccess = function removeOnSuccess() {
          setTimeout(callback, 0);
        };
      }
      req.onerror = function removeOnError() {
        _error('Error in storage.remove(): ' + req.error.name);
      };
    });
  }

  function clear(callback) {
    withStore('readwrite', function clearBody(store) {
      var req = store.clear();
      if (callback) {
        req.onsuccess = function clearOnSuccess() {
          setTimeout(callback, 0);
        };
      }
      req.onerror = function clearOnError() {
        _error('Error in storage.clear(): ' + req.error.name);
      };
    });
  }

  function length(callback) {
    withStore('readonly', function lengthBody(store) {
      var req = store.count();
      req.onsuccess = function lengthOnSuccess() {
        setTimeout(function() { callback(req.result); }, 0);
      };
      req.onerror = function lengthOnError() {
        _error('Error in storage.length(): ' + req.error.name);
      };
    });
  }

  return {
    get: get,
    set: set,
    remove: remove,
    clear: clear,
    length: length,
  };
}

function LocalStorage() {
  function get(key, callback) {
    var value = localStorage.get(key);
    try {
      value = JSON.parse(value);
      if (value['-moz-stringifier']) {
        value = value['-moz-stringifier'];
      }
    } catch(e) {
    } finally {
      setTimeout(function() { callback(value); }, 0);
    }
  }

  function set(key, value, callback) {
    if (value === null || value === undefined) {
      return remove(key, callback);
    }

    if (typeof value === 'object') {
      value = { '-moz-stringifier': value };
      value = JSON.stringify(value);
    }
    localStorage.set(key, value);
    setTimeout(callback, 0);
  }

  function remove(key, callback) {
    localStorage.remove(key);
    setTimeout(callback, 0);
  }

  function clear(callback) {
    localStorage.clear();
    setTimeout(callback, 0);
  }

  function length(callback) {
    var length = localStorage.length;
    setTimeout(function() { callback(length); }, 0);
  }

  return {
    get: get,
    set: set,
    remove: remove,
    clear: clear,
    length: length,
  };
}

this.storage = (function() {
  if ('indexedDB' in window) {
    return IDBStorage();
  }
  // We don't expect any other kind of fallback for the moment.
  return LocalStorage();
}());