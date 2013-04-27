storage.js
==========

This JS library will provide an asynchronous storage API that will use IndexedDB
if supported ond localStorage otherwise. It makes using IndexedDB easy and
transparent for the developers.

## API

The API aims to be very simple and close to localStorage that is known by most
web developers. That means that whatever the backend is (IndexedDB or
localStorage), the data store is going to be represented as a key/value store.

The API is accessible from `window.storage` on which the following methods can
be accessed:

```javascript
get(key, function callback(value) {});

set(key, value, function callback() {});

remove(key, function callback() {});

clear(function callback() {});

length(function callback(length) {});
```

The behaviour of the methods should be self-explanatory.

## Examples

Storing a value:
```javascript
  window.storage.set('key', 'value');
```

Incrementing a stored value:
```javascript
  window.storage.get('key', function(value) {
    window.storage.set('key', value + 1);
  });
```

Clearing the database:
```javascript
  window.storage.clear(function() {
    window.storage.length(function(length) {
      alert('length is equal to ' + length + ', expecting 0.');
    });
  });
```

## Tests

Tests are available in *test.html*.

They currently pass in:
 * IE8+
 * Firefox 3.5+
 * Chrome 5+
 * Opera 10.0+
 * Safari 4.0+
 * Safari iOS 3.2+
 * Android Browser 2.2+
 * Opera Mobile 11.0+

Not tested but should be working on:
 * Firefox Android
 * Chrome Android
 * Blackberry Mobile

## Authors

David Flanagan & Mounir Lamouri
