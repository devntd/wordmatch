/**
 * Common usage
 */
Array.prototype.doClear = function () {
    while (this.length > 0) this.pop();
};

/**
 * Filter
 *
 * @param name
 * @constructor
 */
Filter = function (name) {
    this.name = name;
};

Filter.prototype.checkIndexOf = function (text, char) {
    if (typeof text == 'string' && typeof char == 'string') {
        return text.toLowerCase().indexOf(char.toLowerCase());
    }
    return -1;
};

Filter.prototype.isObject = function (obj) {
    if (typeof obj === 'object' && obj !== null) return true;
    return false;
};

Filter.prototype.checkWord = function (data) {
    if (typeof data == 'object') {
        return alert('Ọbject');
    } else if (data === '') {
        return '';
    }
};

Filter.prototype.loadSound = function () {
    ion.sound({
        sounds: [
            {
                name: "beer_can_opening"
            },
            {
                name: "bell_ring",
                volume: 1
            },
            {
                name: "tap",
                volume: 1,
                preload: false
            },
            {
                name: "right_answer",
                volume: 1
            },
            {
                name: "wrong_answer",
                volume: 1
            }

        ],
        path: "/sounds/"
    });
};

var filter = new Filter();

/**
 * GamePlay
 *
 * @param name
 * @constructor
 */
GamePlay = function (name) {
    this.name = name;
};

var gamePlay = new GamePlay();

Social = function (name) {
    this.name = name;
};

Social.prototype.popupWindow = function (url, title, width, height) {
    var left = (screen.width / 2) - (width / 2);
    var top = (screen.height / 2) - (height / 2);
    return window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' + width + ', height=' + height + ', top=' + top + ', left=' + left);
};

var social = new Social();