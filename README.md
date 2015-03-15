somastation
===========

A readable stream that continuously emits new metadata about what's currently
playing on a particular SomaFM radio station.

If you are looking to consume metadata of what's playing on SomaFM in real-time
check out http://api.somascrobbler.com/ .

## Usage

### stream = somastation(stationId [, options])

**stationId**
```js
//  http://somafm.com/groovesalad/
//  stationId =       ^^^^^^^^^^^
```

**options**

 - `pollInterval` *(integer; optional; default: 30000)*: Poll interval in milliseconds

## Example

```js
var through2 = require('through2');
var somastation = require('somastation');

var groovesalad = somastation('groovesalad', {
  pollInterval: 30000
});

groovesalad
  .pipe(through2.obj(function (track, encoding, callback) {
    console.log(track);
    callback();
  }));
```

Will print:

```
{ time: 1388248804000,
  artist: 'Speedometer',
  title: 'Wake Up Afternoon',
  album: 'Private' }
{ time: 1388249144000,
  artist: 'Visit Venus',
  title: 'Stellar Jungle',
  album: 'Magic Fly Variations' }
{ time: 1388249562000,
  artist: 'Gate Zero',
  title: 'Radio Overboard',
  album: '[THN086] Radio overBoard' }

...
```

## License

MIT License

Copyright (c) 2013 Max Kueng (http://maxkueng.com/)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
