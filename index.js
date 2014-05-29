var util = require('util');
var Readable = require('stream').Readable;
var http = require('http');
var parseXML = require('xml2js').parseString;
var moment = require('moment');
var debug = require('debug')('somastation');

var fs = require('fs');

exports = module.exports = SomaStream;

function getStationXML (stationId, callback) {
	var options = {
		hostname: 'android.somafm.com',
		port: 80,
		path: '/songs/' + stationId + '.xml',
		headers: {
			'User-Agent': 'SomaFMAndroid/2.2.2/3.4.0-gadb2201'
		}
	};

	http.get(options, function (res) {
		var body = '';
		
		if (res.statusCode !== 200) { callback(new Error('Couldn\'t fetch ' + url)); }

		res.setEncoding('utf8');

		res.on('data', function (chunk) {
			body += chunk;
		});

		res.on('end', function () {
			callback(null, body);
		});

	}).on('error', function (err) {
		callback(err);
	});
}

function SomaStream (stationId, options) {
	if (!(this instanceof SomaStream)) { return new SomaStream(stationId, options); }
	Readable.call(this, { objectMode: true });

	options = options || {};

	if (!stationId) {
		return process.nextTick(function () {
			this.emit('error', new Error('Missing station ID'));
		}.bind(this));
	}

	this.pollInterval = options.pollInterval || 60000;
	this.targetedPollingInterval = options.targetedPollingInterval || 10000;
	this.stationId = stationId;
	this.currentTrack = null;

	this.timer = null;

	this.hitCount = 0;
	this.missCount = 0;
	this.currentMissCount = 0;

	this.targetedPollingMode = false;
}

util.inherits(SomaStream, Readable);

SomaStream.prototype.checkNowPlaying = function (callback) {
	var self = this;

	getStationXML(self.stationId, function (err, xml) {
		if (err) { return callback(); } //self.emit('error', err); }

		parseXML(xml, function (err, result) {
			if (err) { return callback(); }
			if (!result.songs || !result.songs.song || !result.songs.song.length) { return callback(); }

			var song, time, artist, title, album, trackId;

			song = result.songs.song[0];

			artist = String(song.artist[0]).trim();
			title = String(song.title[0]).trim();
			album = String(song.album[0]).trim();
			time = Number(song.date[0]) * 1000;
			
			trackId = artist + '-' + title;

			if (self.currentTrack !== trackId) {
				self.currentTrack = trackId;

				debug('hit');
				self.hitCount += 1;

				self.resumeNormalPolling();

				self.push({
					time: time,
					artist: artist,
					title: title,
					album: album
				});

			} else {
				debug('miss');

				self.missCount += 1;
				self.currentMissCount += 1;

				if (self.currentMissCount > 3) {
					self.resumeNormalPolling();
					self.currentMissCount = 0;
				}
			}

			var hitrate =  Math.round(100 * self.hitCount / (self.hitCount + self.missCount) * 100) / 100;
			var miss = +moment.utc() - time;

			debug('hitrate', hitrate, miss);
			fs.appendFileSync('hitrate.csv', moment.utc().format('YYYY-MM-DDTHH:mm:ss') + ';' + hitrate + ';' + miss + '\n', 'utf8');

			callback();
		});
	});
};

SomaStream.prototype.targetedPoll = function (timeout) {
	debug('mode', 'targeted', timeout);
	this.targetedPollingMode = true;
	clearTimeout(this.timer);

	timeout += this.targetedPollingInterval;
	this.nextPoll(timeout);
};

SomaStream.prototype.resumeNormalPolling = function () {
	debug('mode', 'normal');
	this.targetedPollingMode = false;
};

SomaStream.prototype.pollTimeout = function () {
	return (this.targetedPollingMode) ? this.targetedPollingInterval : this.pollInterval;
};

SomaStream.prototype.nextPoll = function (timeout) {
	if (typeof timeout === 'undefined') {
		timeout = this.pollTimeout();
	}

	this.timer = setTimeout(function () {
		this.checkNowPlaying(this.nextPoll.bind(this));
	}.bind(this), timeout);
};

SomaStream.prototype.start = function () {
	process.nextTick(function () {
		this.nextPoll(0);
	}.bind(this));
};

SomaStream.prototype._read = function () {
	if (!this.started) {
		this.started = true;
		this.start();
	}
};
