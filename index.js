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
	this.targetedPollInterval = options.targetedPollInterval || 10000;
	this.stationId = stationId;
	this.currentTrack = null;

	this.timer = null;

	this.hitCount = 0;
	this.missCount = 0;

	this.targetedPollingMode = false;
}

util.inherits(SomaStream, Readable);

SomaStream.prototype.targetedPolling = function (timeout) {
	if (timeout < 0) { timeout = this.pollInterval; }
	debug('target', timeout);
	clearTimeout(this.timer);

	this.targetedPollingMode = true;

	setTimeout(function () {
		this.loop();
	}.bind(this), timeout);
};

SomaStream.prototype.normalPolling = function () {
	debug('normal');
	clearTimeout(this.timer);

	this.targetedPollingMode = false;

	setTimeout(function () {
		this.loop();
	}.bind(this), this.pollInterval);
}

SomaStream.prototype.pollTimeout = function () {
	debug('targetedPollingMode', this.targetedPollingMode);
	return (this.targetedPollingMode) ? this.targetedPollInterval : this.pollInterval;
};

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

				self.hitCount += 1;
				debug('hit', +moment.utc() - time);
				self.normalPolling();

				self.push({
					time: time,
					artist: artist,
					title: title,
					album: album
				});

			} else {
				debug('miss');
				self.missCount += 1;
			}

			debug('hitrate',  (self.hitCount / (self.hitCount + self.missCount) * 100) + '%' );
			fs.appendFileSync('./hitrate.csv', moment.utc().format('YYYY-MM-DDTHH:mm:ss') + ';' + (Math.round( (self.hitCount / (self.hitCount + self.missCount) * 100) * 100) / 100) + '\n', 'utf8');

			callback();
		});
	});
};

SomaStream.prototype.loop = function () {
	this.checkNowPlaying(function () {
		this.timer = setTimeout(function () {
			this.loop();

		}.bind(this), this.pollTimeout());

	}.bind(this));
};

SomaStream.prototype.start = function () {
	process.nextTick(function () {
		this.loop();
	}.bind(this));
};

SomaStream.prototype._read = function () {
	if (!this.started) {
		this.started = true;
		this.start();
	}
};
