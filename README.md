storage.js
==========

This JS library will provide an asynchronous storage API that will use IndexedDB
if supported ond localStorage otherwise. It makes using IndexedDB easy and
transparent for the developers.

## API

The API aims to be very simple and close to localStorage that is known by most
web developers. That means that whatever the backend is (IndexedDB or
localStorage), the data store is going to be represented as a key/value store.

The API is accessible from `window.storage`.

### Methods

From `window.storage`, there are 5 methods that can be accessed:

```javascript
get(key, function callback(value) {});

set(key, value, function callback() {});

remove(key, function callback() {});

clear(function callback() {});

length(function callback(length) {});
```

## Tests

Tests are available in *test.html*.

They currently pass in:
 * IE8+
 * Firefox 3.6+ (3.5 not tested)
 * Chrome 14+ (4-13 not tested)
 * Opera 10.0+
 * Safari 4.0+

## Authors

David Flanagan & Mounir Lamouri
