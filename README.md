storage.js
==========

JS library that will provide an asynchronous storage API.
It will use IndexedDB if present, localStorage otherwise.

## API

The API aims to be very simple and close to localStorage.

There are 5 methods:
```javascript
get(key)
set(key, value)
remove(key)
clear()
length()
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
