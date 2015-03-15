var util = require('util');
var url = require('url');
var Readable = require('readable-stream').Readable;
var assign = require('object-assign');
var request = require('request');
var parseXml = require('xml2js').parseString;

var API_URL = 'http://android.somafm.com';

exports = module.exports = function createStream (stationId, options) {
	return new SomaStream(stationId, options);
};

function damnxml (v) {
	return Array.isArray(v) ? v[0] : v;
}

function getStationUrl (stationId) {
	return url.resolve(API_URL, '/songs/' + stationId + '.xml');
}

function getStationTracks (stationId, callback) {
	var uri = getStationUrl(stationId);

	request({
		url: uri,
		headers: {
			'User-agent': 'SomaFMAndroid/2.2.2/3.4.0-gadb2201'
		}
	}, function (err, res, body) {
		if (err) { return callback(err); }
		if (res.statusCode !== 200) { return callback(new Error('API returned non-200 status')); }

		parseXml(body, { trim: true }, function (err, data) {
			if (err) { return callback(err); }
			if (!data.songs || !data.songs.song) { return callback(new Error('API returned no tracks')); }

			var tracks = data.songs.song
				.map(function (track) {
					return {
						artist: damnxml(track.artist),
						title: damnxml(track.title),
						album: damnxml(track.album),
						time: +damnxml(track.date) * 1000,
					};
				});

			callback(null, tracks);
		});
	});
}

var stationHasUpdated = (function () {
	var etags = {};

	return function (stationId, callback) {
		var uri = getStationUrl(stationId);

		request.head({
			url: uri,
			headers: {
				'User-agent': 'SomaFMAndroid/2.2.2/3.4.0-gadb2201'
			}
		}, function (err, req) {
			if (err) { return callback(false); }
			if (!req.headers.etag) { return callback(true); }
			if (etags[stationId] === req.headers.etag) { return callback(false); }

			etags[stationId] = req.headers.etag;

			callback(true);
		});
	};
})();

var getNowPlaying = (function () {

	var nowPlaying = {};

	function fetchTrack (stationId, callback) {
		getStationTracks(stationId, function (err, tracks) {
			if (err) { return callback(err); }

			var latestTrack = tracks.reduce(function (latest, track) {
				if (!latest) { return track; }
				if (track.time >= latest.time) { return track; }
				return latest;
			});

			nowPlaying[stationId] = latestTrack;
			callback(null, latestTrack);
		});
	}

	return function (stationId, callback) {
		stationHasUpdated(stationId, function (updated) {
			if (!updated) { return callback(null, nowPlaying[stationId]); }

			fetchTrack(stationId, callback);
		});
	};

})();

var defaultOptions = {
	pollInterval: 30000
};

function SomaStream (stationId, options) {
	Readable.call(this, { objectMode: true });

	if (!stationId) { throw new Error('Station ID is required'); }

	this.stationId = stationId;
	this.options = assign({}, defaultOptions, options);
};

util.inherits(SomaStream, Readable);

SomaStream.prototype.poll = function () {
	var self = this;

	function pollAgain () {
		setTimeout(self.poll.bind(self), self.options.pollInterval);
	}

	getNowPlaying(this.stationId, function (err, track) {
		if (err) { return pollAgain() }

		if (!self.currentTrack || track.time > self.currentTrack.time) {
			self.push(track);
		}

		self.currentTrack = track;

		pollAgain();
	});
};

SomaStream.prototype.startPolling = function () {
	this.started = true;
	process.nextTick(this.poll.bind(this));
};

SomaStream.prototype._read = function () {
	if (this.started) { return; }

	this.startPolling();
};
