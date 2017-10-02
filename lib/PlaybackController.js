var TimeKeeper = require("./TimeKeeper");

/*
interface Params {
	fps: number;
	game: any;
	gdr: any;
	driver: any;
	amflow: {
		onTick: (fun: (tick: any) => void) => void;
	};
	handlers: {
		onChangePaused?: (paused: boolean) => void;
		requestUpdateView: (time: number, duration: number) => void;
		onReachReplayLast: () => void;
	};
}
*/

function PlaybackController(params /* : Params */) {
	this._onTick_bound = this._onTick.bind(this);
	this._handleNotifyTime_bound = this._handleNotifyTime.bind(this);
	this._isActive = true;
	this._isPaused = false;
	this._playbackRate = 1;
	this._duration = 0;
	this._time = 0;
	this._fps = params.fps;
	this._game = params.game;
	this._gdr = params.gdr;
	this._driver = params.driver;
	this._amflow = params.amflow;
	this._handlers = params.handlers;
	this._timeKeeper = new TimeKeeper({
		handleNotifyTime: this._handleNotifyTime_bound
	});
	this._amflow.onTick(this._onTick_bound);
}

var klass = PlaybackController;
var proto = PlaybackController.prototype;

klass.calculateDuration = function (tickList, fps) {
	var lastAge = tickList[1];
	var ticks = tickList[2] || [];
	for (let i = ticks.length - 1; i >= 0; --i) {
		var t = ticks[i];
		var ts = klass.getTimestamp(t);
		if (ts != null)
			return ts + (lastAge - t[0]) * 1000 / fps;
	}
	return lastAge * 1000 / fps;
};

klass.getTimestamp = function (tick) {
	var evs = tick[1];
	if (!evs) return null;
	for (var i = 0; i < evs.length; ++i) {
		var ev = evs[i];
		if (ev[0] === 0x2)
			return ev[3];
	}
	return null;
}

proto.setTime = function (time) {
	this._timeKeeper.setTime(time);
};

proto.setPlaybackRate = function (rate) {
	this._playbackRate = rate;
	this._updatePlaybackRate();
};

proto.getDuration = function () {
	return this._duration;
};

proto.togglePaused = function () {
	if (this._isActive) {
		if (this._isPaused) {
			this._driver.startGame();
		} else {
			this._driver.stopGame();
		}
	} else {
		if (this._isPaused) {
			this._timeKeeper.start();
		} else {
			this._timeKeeper.pause();
		}
	}
	this._isPaused = !this._isPaused;
	if (this._handlers.onChangePaused)
		this._handlers.onChangePaused(this._isPaused);
};

proto.switchToReplay = function (callback) {
	if (!this._isActive) return;
	this._isActive = false;
	this._updatePlaybackRate();
	if (this._isPaused) {
		this._driver.startGame();
	} else {
		this._timeKeeper.start();
	}
	this._driver.changeState({
		driverConfiguration: {
			executionMode: this._gdr.ExecutionMode.Passive,
			eventBufferMode: { isSender: false, isReceiver: false }
		},
		loopConfiguration: {
			loopMode: this._gdr.LoopMode.Replay,
			delayIgnoreThreshold: Number.MAX_VALUE,
			jumpTryThreshold: Number.MAX_VALUE,
			targetTimeFunc: this._timeKeeper.getBoundTimeFunc()
		}
	}, callback);
};

proto.switchToActive = function (callback) {
	if (this._isActive) return;
	this._isActive = true;
	this._playbackRate = 1;
	this._updatePlaybackRate();
	if (this._isPaused) {
		this._driver.stopGame();
	} else {
		this._timeKeeper.pause();
	}
	this._driver.changeState({
		driverConfiguration: {
			executionMode: this._gdr.ExecutionMode.Active,
			eventBufferMode: { isSender: false, isReceiver: true }
		},
		loopConfiguration: {
			loopMode: this._gdr.LoopMode.Realtime,
			delayIgnoreThreshold: 6,
			jumpTryThreshold: 90000
		}
	}, callback);
};

proto._updatePlaybackRate = function () {
	if (this._isActive) {
		this._driver._gameLoop.setLoopConfiguration({ playbackRate: this._playbackRate });
		this._timeKeeper.setRate(1);
	} else {
		this._driver._gameLoop.setLoopConfiguration({ playbackRate: 1 });
		this._timeKeeper.setRate(this._playbackRate);
	}

	// TODO: viewとくっついててきもい
	if(this._playbackRate === 20){
		$('#speed').css('background-image','url(page/speed20_on.png)');
		$('#seek_blue').css('animation-duration','0.1s');
	}
	else if(this._playbackRate === 5){
		$('#speed').css('background-image','url(page/speed5_on.png)');
		$('#seek_blue').css('animation-duration','0.3s');
	}
	else{
		$('#speed').css('background-image','url(page/speed1_on.png)');
		$('#seek_blue').css('animation-duration','0.8s');
	}
};

proto._onTick = function (tick) {
	var ts = klass.getTimestamp(tick);
	this._duration = ts ? ts : (this._duration + 1000 / this._fps);
	var now = this._isActive ? this._duration : this._time;
	this._handlers.requestUpdateView(now, this._duration);
};

proto._handleNotifyTime = function (time) {
	this._time = time;
	this._handlers.requestUpdateView(this._time, this._duration);
	if (this._time >= this._duration && this._game.age >= this._amflow._tickList[1] && !this._isActive) {
		var self = this;
		setTimeout(function () { self._handlers.onReachReplayLast(); }, 0);
	}
};

proto.resetDuration = function(tickList) {
	this._duration = klass.calculateDuration(tickList, this._fps);
	this._handlers.requestUpdateView(this._time, this._duration);
}

module.exports = PlaybackController;
