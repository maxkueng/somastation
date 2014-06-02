somastation
===========

Stream recent tracks of a SomaFM radio station.

## API

### `new SomaStationStream(stationId [, options])`

 - `stationId` (required) is the name of the station found in SomaFM urls, such as "deepspaceone" for "Deep Space One"
 - `options` (optional)
   - `pollInterval`: Interval in milliseconds in which the SomaFM API queries for new tracks. Default: 60000
   - `targetedPollingInterval`: Interval in milliseconds in which the SomaFM API queries for new tracks during "targeted polling mode". Default: 10000
   - `targetedPollingEndurance`: The maximum number of "missed" polls during "targeted polling mode" before switching to "normal polling mode". Default: 3

#### Targeted Polling

In oder to increase accuracy and reduce the amount of "missed" polls
(i.e. polling without getting a new track because the current track is
still playing), polling can be optimized using `.targetedPoll(timeout)`.
For example, when the start time and the duration of the current track
is known, the time until the next track can be estimated like so:
`(track time + duration) - now`.

The calculated time span (in milliseconds) can then be used as the
timeout for a targeted poll. Calling `.targetedPoll(timeout)` on the
stream will stop polling for `timeout` milliseconds and then enter
"targeted polling mode" in which the API will be queried every
`targetedPollingInterval` milliseconds until a new track is available.
To prevent the thing from going crazy if the `timeout` estimation has
been completely off, the stream will return to "normal polling" after it
has "missed" the beginning of a new track `targetedPollingEndurance`
times.

A 12-hour test on the Groove Salad has shown that with polling the API
every 60 seconds, only 19.92% of all polls actually find a new track.
With targeted polling with the default settings and track durations
gathered from Last.fm the the success rate can be increased to 52.35%.  
This can probably be increased further by getting more accurate track
durations.

## Example

```javascript
var SomaStationStream = require('somastation'),
    through = require('through');

new SomaStationStream('groovesalad')
    .pipe(through(function (track) {
        // track.time is the UTC unix offset in milliseconds
        console.log(track);
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
