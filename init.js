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
