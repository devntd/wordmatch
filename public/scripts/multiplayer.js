/**
 * Created by dung on 12/25/2014.
 */
    // Global variables
CHAR_CODE_A = 'a'.charCodeAt(0);
CHAR_CODE_X = 'x'.charCodeAt(0);
CHAR_CODE_Z = 'z'.charCodeAt(0);

var SECONDS_PER_ROUND = 10;

var char = {
    current: 0,
    next: 0
};

var countDownTimeout, inRoundFlag = false;
var passedWords = [], score = 0, timeRemaining;
var socket;

(function ($) {
    socket = io.connect('http://wordmatch.org:4100');

    // Init slide
    var bxSlider = $('.game_content').bxSlider({
        slideWidth: 600,
        minSlides: 1,
        maxSlides: 1,
        moveSlides: 1,
        controls: false,
        autoDelay: 200
    });
    $('#start-game').on('touchstart, click', function () {

        socket.emit('join game');
    });
    $('#word_text').keyup(function (e) {
        if (e.which == 13) {
            var text = $('#word_text').val();
            socket.emit('play game', text);
        }
    });

    socket.on('update rooms', function (data1, data2) {
        console.log('Socket: ' + data1 + ': ' + data2);
    });

    socket.on('let play', function (data) {
        console.log('socket client: ' + socket.io.engine.id);
        if (socket.io.engine.id == data) {
            socket.emit('first play', 'Da bat dau' + socket.io.engine.id);
        }
    });

    // x2
    function getInput() {
        return $('#word_text').val().trim().toLowerCase();
    }

})(jQuery);