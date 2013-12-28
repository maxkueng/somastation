var util = require('util'),
	Readable = require('stream').Readable
	http = require('http'),
	cheerio = require('cheerio'),
	moment = require('moment-timezone');

exports = module.exports = SomaStream;

function soma2utc (timestr) {
	var now, soma, matches = /(\d\d):(\d\d):(\d\d)/.exec(timestr);
	if (!matches) { return null; }

	now = moment.utc();
	soma = moment.tz(now, 'US/Pacific');
	soma.subtract('m', soma.zone());
	soma.hours(matches[1]);
	soma.minutes(matches[2]);
	soma.seconds(matches[3]);
	soma.milliseconds(0);
	soma.utc();

	return +soma;
}

function getStationHTML (stationId, callback) {
	var url = 'http://somafm.com/recent/' + stationId + '.html';

	http.get(url, function (res) {
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

	getStationHTML(self.stationId, function (err, html) {
		if (err) { return; } //self.emit('error', err); }

		var $ = cheerio.load(html),
			rows;

		rows = $('table tr');
		rows.each(function (index, row) {
			var cols, time, artist, title, album, trackId;

			cols = $(row).children('td');
			if (cols.length !== 5) { return; }

			time = $(cols[0]).text().trim();
			if (!(/\(now\)/i.test(time))) { return; }

			artist = $(cols[1]).text().trim();
			title = $(cols[2]).text().trim();
			album = $(cols[3]).text().trim();
			
			trackId = artist + '-' + title;

			if (self.currentTrack !== trackId) {
				self.currentTrack = trackId;

				self.push({
					time: soma2utc(time),
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
