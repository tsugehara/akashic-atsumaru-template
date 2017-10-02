(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
window.addEventListener("load", function() {
	window.sandboxDeveloperProps.driver.gameCreatedTrigger.handle(function(game) {
		window.sandboxDeveloperProps.game = game;
		var gameDriver = window.sandboxDeveloperProps.driver;
		var amflow = window.sandboxDeveloperProps.amflow;
		var gdr = window.sandboxDeveloperProps.gdr;

		var PlaybackController = require("./lib/PlaybackController");
		var playbackController = new PlaybackController({
			fps: game.fps,
			game: game,
			gdr: gdr,
			driver: driver,
			amflow: amflow,
			handlers: {
				requestUpdateView: set_time || function () {},
				onReachReplayLast: function () {
					driver.setNextAge(amflow._tickList[1] + 1);  // Ugh! 次ageの算出方法は暫定。
					playbackController.switchToActive(function (e) { if (e) console.log(e); });
				}
			}
		});

		var seekBlue = document.getElementById("seek_blue");
		var seekWhite = document.getElementById("seek_white");
		var playstop = document.getElementById("playstop");
		var speed = document.getElementById("speed");
		if (seekBlue) {
			function onClickSeekBar(e) {
				var time = playbackController.getDuration() * e.offsetX / seekWhite.offsetWidth;
				playbackController.setTime(time);
				playbackController.switchToReplay(function (e) { if (e) console.log(e); });
			}
			seekBlue.addEventListener("click", onClickSeekBar);
			seekWhite.addEventListener("click", onClickSeekBar);
			playstop.addEventListener("click", function () {
				playbackController.togglePaused();
			});
			speed.addEventListener("click", function () {
				// Ugh! animation.js の speed_flag 更新を待つ setTimeout(). ちゃんと animation.js と統合すべき。
				switch (playbackController._playbackRate) {
					case 1:
						playbackController.setPlaybackRate(5);
					break;
					case 5:
						playbackController.setPlaybackRate(20);
					break;
					case 20:
						playbackController.setPlaybackRate(1);
					break;
				}
			});
		}

		var saveButton = document.getElementById("btn_save");
		var loadButton = document.getElementById("btn_load");
		if (window.RPGAtsumaru) {
			var plugin = require("akashic-atsumaru-plugin");
			plugin.init({
				atsumaru: window.RPGAtsumaru,
				game: game,
				gameDriver: gameDriver,
				amflow: amflow,
				gdr: gdr
			});
		}

		// TODO: ちょっと不細工だけどいったんデバッグ用に
		if (saveButton) {
			saveButton.addEventListener("click", function() {
				if (window.RPGAtsumaru) {
					game.external.atsumaru.storage.saveCurrentPlaylog("1");
				} else {
					// ただのデバッグ用
					console.log("save playlog", amflow.dump());
					window.localStorage.setItem("save", JSON.stringify(amflow.dump()));
				}
			});
		}
		if (loadButton) {
			loadButton.addEventListener("click", function() {
				function loadLocalStorage() {
					return Promise.resolve(window.localStorage.getItem("save"));
				}
				var p = (window.RPGAtsumaru) ? game.external.atsumaru.storage.load("1") : loadLocalStorage();
				p.then(function (value) {
					var playlog = JSON.parse(value);
					amflow._tickList = playlog.tickList;  // Ugh! 非公開の値を直接書き換えている暫定処理
					amflow._startPoints = playlog.startPoints;
					playbackController.setTime(0);
					playbackController.resetDuration(playlog.tickList); 
					playbackController.switchToReplay(function (e) { if (e) console.log(e); });
				});
			});
		}

		return false;
	});
});

},{"./lib/PlaybackController":2,"akashic-atsumaru-plugin":4}],2:[function(require,module,exports){
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

},{"./TimeKeeper":3}],3:[function(require,module,exports){
function TimeKeeper(params) {
	this._isRunning = false;
	this._rate = 1;
	this._offset = 0;
	this._now = 0;
	this._pausedAt = 0;
	this._params = params;
	this._getTime_bound = this.getTime.bind(this);
}

var proto = TimeKeeper.prototype;

proto.getBoundTimeFunc = function () {
	return this._getTime_bound;
}

proto.isRunning = function () {
	return this._isRunning;
};

proto.getTime = function () {
	var time = this._isRunning ? (Date.now() - this._origin) * this._rate + this._offset : this._pausedAt;
	this._params.handleNotifyTime(time);
	return time;
};

proto.setTime = function (time) {
	this._offset = time;
	this._origin = Date.now();
	this._pausedAt = time;
};

proto.start = function () {
	if (this._isRunning) return;
	this._offset = this._pausedAt;
	this._origin = Date.now();
	this._isRunning = true;
};

proto.pause = function () {
	if (!this._isRunning) return;

	this._pausedAt = this.getTime();
	this._isRunning = false;
}

proto.setRate = function (rate) {
	if (this._rate === rate)
		return;
	this.setTime(this.getTime()); // _offsetをリセット
	this._rate = rate;
};

proto.getRate = function () {
	return this._rate;
};

module.exports = TimeKeeper;

},{}],4:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
function init(param) {
    param.game.external.atsumaru = new AtsumaruPlugin(param);
}
exports.init = init;
var AtsumaruAPI = (function () {
    function AtsumaruAPI(param) {
        this.atsumaru = param.atsumaru;
        this.game = param.game;
        this.gameDriver = param.gameDriver;
        this.amflow = param.amflow;
        this.gdr = param.gdr;
    }
    return AtsumaruAPI;
}());
exports.AtsumaruAPI = AtsumaruAPI;
var AtsumaruPlugin = (function () {
    // controller: ControllerAPI;
    function AtsumaruPlugin(param) {
        this.storage = new StorageAPI(param);
        this.comment = new CommentAPI(param);
    }
    return AtsumaruPlugin;
}());
exports.AtsumaruPlugin = AtsumaruPlugin;
var StorageAPI = (function (_super) {
    __extends(StorageAPI, _super);
    function StorageAPI() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    StorageAPI.prototype.saveCurrentPlaylog = function (slotId) {
        // 動かない・・
        var dump = this.amflow.dump();
        return this.save(slotId, JSON.stringify(dump));
    };
    StorageAPI.prototype.loadPlaylog = function (slotId) {
        var _this = this;
        this.load(slotId).then(function (value) {
            var playlog = JSON.parse(value);
            _this.amflow._tickList = playlog.tickList;
            _this.amflow._startPoints = playlog.startPoints;
            // 非公開I/Fのようなので強引に飛ばす
            _this.game.requestNotifyAgePassed(playlog.tickList[1]);
            _this.game.agePassedTrigger.handle(function (age) {
                _this.gameDriver.changeState({
                    driverConfiguration: {
                        executionMode: _this.gdr.ExecutionMode.Active,
                        playToken: _this.gdr.MemoryAmflowClient.TOKEN_ACTIVE
                    },
                    loopConfiguration: {
                        playbackRate: 1,
                        loopMode: _this.gdr.LoopMode.Realtime,
                        delayIgnoreThreshold: 6,
                        jumpTryThreshold: 90000
                    }
                }, function (err) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    _this.gameDriver.setNextAge(playlog.tickList[1] + 1);
                    _this.gameDriver.startGame();
                });
                return false;
            });
            _this.gameDriver.changeState({
                driverConfiguration: {
                    executionMode: _this.gdr.ExecutionMode.Passive,
                    playToken: _this.gdr.MemoryAmflowClient.TOKEN_PASSIVE
                },
                loopConfiguration: {
                    playbackRate: playlog.tickList[1] > 1000 ? 20 : 5,
                    loopMode: _this.gdr.LoopMode.Replay,
                    targetAge: 0,
                    delayIgnoreThreshold: Number.MAX_VALUE,
                    jumpTryThreshold: Number.MAX_VALUE
                }
            }, function (err) {
                if (err) {
                    console.log(err);
                    return;
                }
            });
        });
    };
    StorageAPI.prototype.listPlaylog = function () {
        // TODO
    };
    StorageAPI.prototype.save = function (slotId, data) {
        var _this = this;
        return this.atsumaru.storage.getItems().then(function (items) {
            var matched = false;
            for (var i = 0; i < items.length; i++) {
                if (items[i].key === slotId) {
                    items[i].value = data;
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                items.push({
                    key: slotId,
                    value: data
                });
            }
            return _this.atsumaru.storage.setItems(items);
        });
    };
    StorageAPI.prototype.load = function (slotId) {
        return this.atsumaru.storage.getItems().then(function (items) {
            var targetItems = items.filter(function (item) { return item.key === slotId; });
            if (targetItems.length === 0) {
                return Promise.reject(new Error(slotId + " not found."));
            }
            return Promise.resolve(targetItems[0].value);
        });
    };
    StorageAPI.prototype.remove = function (slotId) {
        return this.atsumaru.storage.removeItem(slotId);
    };
    return StorageAPI;
}(AtsumaruAPI));
exports.StorageAPI = StorageAPI;
var CommentAPI = (function (_super) {
    __extends(CommentAPI, _super);
    function CommentAPI(param) {
        var _this = _super.call(this, param) || this;
        _this.sceneIndex = 0;
        _this.autoChangeScene = false;
        param.game._sceneChanged.handle(_this, _this.onSceneChanged);
        return _this;
    }
    CommentAPI.prototype.pushContextFactor = function (factor) {
        return this.atsumaru.comment.pushContextFactor(factor);
    };
    CommentAPI.prototype.pushMinorContext = function () {
        return this.atsumaru.comment.pushMinorContenxt();
    };
    CommentAPI.prototype.resetAndChangeScene = function (sceneName) {
        return this.atsumaru.comment.resetAndChangeScene(sceneName);
    };
    CommentAPI.prototype.changeScene = function (sceneName) {
        return this.atsumaru.comment.changeScene(sceneName);
    };
    CommentAPI.prototype.setContext = function (context) {
        return this.atsumaru.comment.setContext(context);
    };
    CommentAPI.prototype.onSceneChanged = function (scene) {
        this.sceneIndex++;
        if (this.autoChangeScene) {
            this.atsumaru.comment.changeScene(scene.name || "" + this.sceneIndex);
        }
    };
    return CommentAPI;
}(AtsumaruAPI));
exports.CommentAPI = CommentAPI;
// TODO: あとで
// export class ControllerAPI extends AtsumaruAPI {
// 	subscrive(observer: Observer) {
// 		return RPGAtsumaru.controllers.defaultController.subscribe(observer);
// 	}
// }

},{}]},{},[1]);
