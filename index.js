var util = require('util'),
	Readable = require('stream').Readable
	http = require('http'),
	parseXML = require('xml2js').parseString;

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
	this.stationId = stationId;
	this.currentTrack = null;
}

util.inherits(SomaStream, Readable);

SomaStream.prototype.checkNowPlaying = function (callback) {
	var self = this;

	getStationXML(self.stationId, function (err, xml) {
		if (err) { return callback(); } //self.emit('error', err); }

		parseXML(xml, function (err, result) {
			if (err) { return; }
			if (!result.songs || !result.songs.song || !result.songs.song.length) { return; }

			var song, time, artist, title, album, trackId;

			song = result.songs.song[0];

			artist = String(song.artist[0]).trim();
			title = String(song.title[0]).trim();
			album = String(song.album[0]).trim();
			time = Number(song.date[0]) * 1000;
			
			trackId = artist + '-' + title;

			if (self.currentTrack !== trackId) {
				self.currentTrack = trackId;

				self.push({
					time: time,
					artist: artist,
					title: title,
					album: album
				});
			}
		});

		callback();
	});
};

SomaStream.prototype.loop = function () {
	var self = this;

	self.checkNowPlaying(function () {
		setTimeout(function () {
			self.loop();
		}, self.pollInterval);
	});
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
