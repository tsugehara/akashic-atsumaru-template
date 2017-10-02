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
