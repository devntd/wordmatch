/**
 * Common usage
 */
Array.prototype.doClear = function () {
    while (this.length > 0) this.pop();
};

/**
 * Filter
 *
 * @constructor
 */
Filter = function () {
};

Filter.prototype.isObject = function (obj) {
    return (typeof obj === 'object' && obj !== null);
};

Filter.prototype.loadSound = function () {
    ion.sound({
        sounds: [
            {name: "tap", volume: 1},
            {name: "wrong_answer", volume: 1},
            {name: "bell_ring", volume: 1},
            {name: "right_answer", volume: 1}, // answer is true and add coin
            {name: "smb_coin", volume: 1}, // answer is true and add coin
            {name: "smb_gameover", volume: 1}, // Game over
            {name: "smb_stage_clear", volume: 1}, // clear game
            {name: "smb_mariodie", volume: 1}, // fall game
            {name: "smb_bowserfalls", volume: 1}, // fall game
            {name: "tap", volume: 1}, // fall game
            {name: "smb_bump", volume: 1}, // fall game
            {name: "smb_kick", volume: 1}, // fall game
            {name: "smb_1-up", volume: 1}, // fall game
            {name: "bell_ring", volume: 1}, // fall game
            {name: "smb_pause", volume: 1} // pause and exit
        ], path: "/sounds/"
    });
};

var filter = new Filter();

/**
 * GamePlay
 *
 * @constructor
 */
GamePlay = function () {
};

var gamePlay = new GamePlay();

/**
 * Social
 *
 * @constructor
 */
Social = function () {
};

Social.prototype.popupWindow = function (url, title, width, height) {
    var left = (screen.width / 2) - (width / 2);
    var top = (screen.height / 2) - (height / 2);
    return window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' + width + ', height=' + height + ', top=' + top + ', left=' + left);
};

var social = new Social();
