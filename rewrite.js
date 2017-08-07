module.exports = function() {
	var fs = require("fs");
	var path = require("path");
	var htmlParser = require("htmlparser2");

	function readFile(path) {
		return new Promise((resolve, reject) => {
			fs.readFile(path, {encoding: "utf8"}, (err, data) => {
				if (err) {
					reject(err);
					return;
				}
				resolve(data);
			});
		});
	}
	function createJs(path, script) {
		return new Promise((resolve, reject) => {
			console.log(path);
			fs.writeFile(path, script, () => {
				console.log(path);
				resolve(path);
			});
		});
	}
	function createJsFiles(dir, scripts) {
		return new Promise((resolve, reject) => {
			var promises = [];
			scripts.forEach((script, index) => {
				promises.push(createJs(path.join(dir, index + ".js"), script));
			});
			return Promise.all(promises).then(() => {
				resolve(scripts);
			});
		});
	}
	function rewriteHtml(path, scripts) {
		return new Promise((resolve, reject) => {
			fs.readFile(path, {encoding: "utf8"}, function(err, data) {
				if (err) {
					reject(err);
					return;
				}
				var end = -1;
				var thisTag = false;
				var parser = new htmlParser.Parser({
					onopentag: function(name, attr) {
						if (name === "div" && attr.id === "container") {
							thisTag = true;
						}
					},
					onclosetag: function(name) {
						if (thisTag) {
							thisTag = false;
							end = parser.endIndex + 1;
						}
					},
					onend: function() {
						if (end === -1) {
							reject(new Error("can not find sandbox.js"));
							return;
						}
						console.log(typeof data);
						var html = data.substr(0, end) + "\n" + scripts.join("\n") + data.substr(end);
						fs.writeFile(path, html, {encoding: "utf8"}, function(err2) {
							if (err2) {
								reject(err2);
								return;
							}
							resolve();
						});
					}
				});
				parser.write(data);
				parser.end();
			});
		});
	}
	function copyFile(src, dist) {
		const r = fs.createReadStream(src);
		const w = fs.createWriteStream(dist);
		return new Promise((resolve, reject) => {
			r.on("error", (err) => {
				reject(err);
			});
			w.on("error", (err) => {
				reject(err);
			});
			w.on("close", () => {
				resolve();
			});
			r.pipe(w);
		});
	}
	function copyDirectory(src, dist) {
		return new Promise((resolve, reject) => {
			fs.readdir(src, (err, files) => {
				Promise.all(files.map((f) => copyFile(path.join(src, f), path.join(dist, f))))
					.then(resolve)
					.catch(reject);
			});
		});
	}
	function createDirectory(path) {
		return new Promise((resolve, reject) => {	
			fs.mkdir(path, (err) => {
				// 存在チェックするよりこのエラー無視しちゃう
				// if (err) {
				// 	reject(err)
				// 	return;
				// }
				resolve();
			})
		});
	}
	var basePath = "html";
	var htmlFile = path.join(basePath, "index.html");
	var insertCodes = [
		"<script src=\"./js/atsumaru.js\"></script>",
		"<script src=\"./page/jquery-1.11.3.min.js\"></script>",
		"<script src=\"./page/animation.js\"></script>",
		"<div id=\"side_btn\">",
		"<input type=\"button\" value=\"\" id=\"btn_save\"/>",
		"<input type=\"button\" value=\"\" id=\"btn_load\"/>",
		"</div>",
		'<div id="seekbar">',
		'	<div class="seek_menu">',
		'		<input type="button" value="" id="playstop"/>',
		'		<input type="button" value="" id="speed"/>',
		'		<div class="timewindow">0:00:00 / 0:00:00</div>',
		'	</div>',
		'	<div id="slyder"></div>',
		'	<div class="seek_end"></div>',
		'	<div class="seek_back">',
		'		<div id="seek_blue"></div>',
		'		<div class="seek_white"></div>',
		'	</div>',
		'</div>'
	];

	createDirectory(path.join(process.cwd(), "html", "page"))
		.then(copyDirectory(path.join(__dirname, "template", "page"), path.join(process.cwd(), "html", "page")))
		.then(copyDirectory(path.join(__dirname, "template", "css"), path.join(process.cwd(), "html", "css")))
		.then(copyDirectory(path.join(__dirname, "template", "js"), path.join(process.cwd(), "html", "js")))
		.then(rewriteHtml(path.join(process.cwd(), "html", "index.html"), insertCodes))
		.then(() => {
			console.log("finished");
		});
}
