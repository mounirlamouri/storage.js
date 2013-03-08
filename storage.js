/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

/**
 * This file defines an asynchronous version of the localStorage API, backed by
 * an IndexedDB database.  It creates a global asyncStorage object that has
 * methods like the localStorage object.
 *
 * To store a value use setItem:
 *
 *   asyncStorage.setItem('key', 'value');
 *
 * If you want confirmation that the value has been stored, pass a callback
 * function as the third argument:
 *
 *  asyncStorage.setItem('key', 'newvalue', function() {
 *    console.log('new value stored');
 *  });
 *
 * To read a value, call getItem(), but note that you must supply a callback
 * function that the value will be passed to asynchronously:
 *
 *  asyncStorage.getItem('key', function(value) {
 *    console.log('The value of key is:', value);
 *  });
 *
 * Note that unlike localStorage, asyncStorage does not allow you to store and
 * retrieve values by setting and querying properties directly. You cannot just
 * write asyncStorage.key; you have to explicitly call setItem() or getItem().
 *
 * removeItem(), clear(), length(), and key() are like the same-named methods of
 * localStorage, but, like getItem() and setItem() they take a callback
 * argument.
 *
 * The asynchronous nature of getItem() makes it tricky to retrieve multiple
 * values. But unlike localStorage, asyncStorage does not require the values you
 * store to be strings.  So if you need to save multiple values and want to
 * retrieve them together, in a single asynchronous operation, just group the
 * values into a single object. The properties of this object may not include
 * DOM elements, but they may include things like Blobs and typed arrays.
 *
 * Unit tests are in apps/gallery/test/unit/asyncStorage_test.js
 */

var DEBUG = false;

function _error(msg) {
  if (DEBUG == true) {
    console.error(msg);
  }
}

function IDBStorage() {
  var DBNAME = 'asyncStorage';
  var DBVERSION = 1;
  var STORENAME = 'keyvaluepairs';
  var db = null;

  function withStore(type, f) {
    if (db) {
      f(db.transaction(STORENAME, type).objectStore(STORENAME));
    } else {
      var openreq = indexedDB.open(DBNAME, DBVERSION);
      openreq.onerror = function withStoreOnError() {
        _error("asyncStorage: can't open database:" + openreq.error.name);
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

  function getItem(key, callback) {
    withStore('readonly', function getItemBody(store) {
      var req = store.get(key);
      req.onsuccess = function getItemOnSuccess() {
        var value = req.result;
        if (value === undefined)
          value = null;
        setTimeout(function() { callback(value); }, 0);
      };
      req.onerror = function getItemOnError() {
        _error('Error in asyncStorage.getItem(): ' + req.error.name);
      };
    });
  }

  function setItem(key, value, callback) {
    withStore('readwrite', function setItemBody(store) {
      var req = store.put(value, key);
      if (callback) {
        req.onsuccess = function setItemOnSuccess() {
          setTimeout(callback, 0);
        };
      }
      req.onerror = function setItemOnError() {
        _error('Error in asyncStorage.setItem(): ' + req.error.name);
      };
    });
  }

  function removeItem(key, callback) {
    withStore('readwrite', function removeItemBody(store) {
      var req = store['delete'](key);
      if (callback) {
        req.onsuccess = function removeItemOnSuccess() {
          setTimeout(callback, 0);
        };
      }
      req.onerror = function removeItemOnError() {
        _error('Error in asyncStorage.removeItem(): ' + req.error.name);
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
        _error('Error in asyncStorage.clear(): ' + req.error.name);
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
        _error('Error in asyncStorage.length(): ' + req.error.name);
      };
    });
  }

  return {
    getItem: getItem,
    setItem: setItem,
    removeItem: removeItem,
    clear: clear,
    length: length,
  };
}

function LocalStorage() {
  function getItem(key, callback) {
    var value = localStorage.getItem(key);
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

  function setItem(key, value, callback) {
    if (value === null || value === undefined) {
      return removeItem(key, callback);
    }

    if (typeof value === 'object') {
      value = { '-moz-stringifier': value };
      value = JSON.stringify(value);
    }
    localStorage.setItem(key, value);
    setTimeout(callback, 0);
  }

  function removeItem(key, callback) {
    localStorage.removeItem(key);
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
    getItem: getItem,
    setItem: setItem,
    removeItem: removeItem,
    clear: clear,
    length: length,
  };
}

this.asyncStorage = (function() {
  if ('indexedDB' in window) {
    return IDBStorage();
  }
  // We don't expect any other kind of fallback for the moment.
  return LocalStorage();
}());

