module.exports = function() {
	var fs = require("fs");
	var path = require("path");

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
			console.log("rewrite!!");
			resolve(scripts);
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
			console.log("=---------------");
			console.log(src);
			console.log(dist);
			console.log("=---------------");
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

	createDirectory(path.join(process.cwd(), "html", "img"))
		.then(createDirectory(path.join(process.cwd(), "html", "page")))
		.then(copyDirectory(path.join(__dirname, "template", "page"), path.join(process.cwd(), "html", "page")))
		.then(copyDirectory(path.join(__dirname, "template", "css"), path.join(process.cwd(), "html", "css")))
		.then(copyFile(path.join(__dirname, "template", "index.html"), path.join(process.cwd(), "html", "index.html")))
		.then(copyDirectory(path.join(__dirname, "template", "js"), path.join(process.cwd(), "html", "js")))
		.then(() => {
			console.log("finished");
		});
}
