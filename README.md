somastation
===========

Stream recent tracks of a SomaFM radio station.

## API

### `new SomaStationStream(stationId [, options])`

 - `stationId` (required) is the name of the station found in SomaFM urls, such as "deepspaceone" for "Deep Space One"
 - `options` (optional) can have a `pollInterval` property containing the polling intrval in milliseconds. Default: 60000

## Example

```javascript
var SomaStationStream = require('somastation'),
    through = require('through');

new SomaStationStream('groovesalad')
    .pipe(through(function (track) {
        console.log(new Date());
        console.log(track);
    }));
```

Will print:

```
Thu Dec 26 2013 17:14:11 GMT+0100 (CET)
{ artist: 'Quant',
  title: 'Sauna Grease',
  album: 'Quantastical Quantasm' }
Thu Dec 26 2013 17:15:12 GMT+0100 (CET)
{ artist: 'Hooverphonic',
  title: '2wicky',
  album: 'A New Stereophonic Sound Spect' }
Thu Dec 26 2013 17:20:18 GMT+0100 (CET)
{ artist: 'Beanfield',
  title: 'Abstractions',
  album: 'Human Patters' }

...
```

##License

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
