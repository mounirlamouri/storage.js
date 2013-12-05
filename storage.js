this.storage = (function() {
  "use strict";

  var DEBUG = false;

  function error(msg) {
    if (DEBUG === true) {
      window.console.error(msg);
    }
  }

  function IDBStorage() {
    var DBNAME = 'storage_js';
    var DBVERSION = 1;
    var STORENAME = 'keyvaluepairs';
    var db = null;
    var isChrome = /Chrome/.test(navigator.userAgent) &&
                   /Google Inc/.test(navigator.vendor);

    function withStore(type, f) {
      if (db) {
        f(db.transaction(STORENAME, type).objectStore(STORENAME));
      } else {
        var openreq = window.indexedDB.open(DBNAME, DBVERSION);
        openreq.onerror = function withStoreOnError() {
          error("storage.js: can't open database:" + openreq.error.name);
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
          var value = req.result !== undefined ? req.result : null;

          if (isChrome) {
            value = Kamino.parse(value);
            setTimeout(function() { callback(value); }, 0);
          } else {
            callback(value);
          }
        };
        req.onerror = function getOnError() {
          error('Error in storage.get(): ' + req.error.name);
        };
      });
    }

    function remove(key, callback) {
      withStore('readwrite', function removeBody(store) {
        var req = store['delete'](key);
        if (callback) {
          req.onsuccess = function removeOnSuccess() {
            if (isChrome) {
              setTimeout(callback, 0);
            } else {
              callback();
            }
          };
        }
        req.onerror = function removeOnError() {
          error('Error in storage.remove(): ' + req.error.name);
        };
      });
    }

    function set(key, value, callback) {
      // IE10 has a bug and miserably fails when store.put(null, key) is called.
      if (value === null || value === undefined) {
        return remove(key, callback);
      }

      if (isChrome) {
        value = Kamino.stringify(value);
      }

      withStore('readwrite', function setBody(store) {
        var req = store.put(value, key);
        if (callback) {
          req.onsuccess = function setOnSuccess() {
            if (isChrome) {
              setTimeout(callback, 0);
            } else {
              callback();
            }
          };
        }
        req.onerror = function setOnError() {
          error('Error in storage.set(): ' + req.error.name);
        };
      });
    }

    function clear(callback) {
      withStore('readwrite', function clearBody(store) {
        var req = store.clear();
        if (callback) {
          req.onsuccess = function clearOnSuccess() {
            if (isChrome) {
              setTimeout(callback, 0);
            } else {
              callback();
            }
          };
        }
        req.onerror = function clearOnError() {
          error('Error in storage.clear(): ' + req.error.name);
        };
      });
    }

    function length(callback) {
      withStore('readonly', function lengthBody(store) {
        var req = store.count();
        req.onsuccess = function lengthOnSuccess() {
          if (isChrome) {
            setTimeout(function() { callback(req.result); }, 0);
          } else {
            callback(req.result);
          }
        };
        req.onerror = function lengthOnError() {
          error('Error in storage.length(): ' + req.error.name);
        };
      });
    }

    return {
      get: get,
      set: set,
      remove: remove,
      clear: clear,
      length: length
    };
  }

  function LocalStorage() {
    function get(key, callback) {
      var value = Kamino.parse(localStorage.getItem(key));
      setTimeout(function() { callback(value); }, 0);
    }

    function remove(key, callback) {
      localStorage.removeItem(key);
      if (callback) {
        setTimeout(callback, 0);
      }
    }

    function set(key, value, callback) {
      if (value === null || value === undefined) {
        return remove(key, callback);
      }

      localStorage.setItem(key, Kamino.stringify(value));
      if (callback) {
        setTimeout(callback, 0);
      }
    }

    function clear(callback) {
      localStorage.clear();
      if (callback) {
        setTimeout(callback, 0);
      }
    }

    function length(callback) {
      var result = localStorage.length;
      setTimeout(function() { callback(result); }, 0);
    }

    return {
      get: get,
      set: set,
      remove: remove,
      clear: clear,
      length: length
    };
  }

  if ('indexedDB' in window) {
    return new IDBStorage();
  }
  // We don't expect any other kind of fallback for the moment.
  return new LocalStorage();
}());
