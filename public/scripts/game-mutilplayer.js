/**
 * Created by dung on 12/26/2014.
 */
// Global variables
CHAR_CODE_A = 'a'.charCodeAt(0);
CHAR_CODE_X = 'x'.charCodeAt(0);
CHAR_CODE_Z = 'z'.charCodeAt(0);

SECONDS_PER_ROUND = 10;

var char = {
    current: 0,
    next: 0
};
var countDownTimeout, inRoundFlag = false;
var passedWords = [], score = 0, timeRemaining;
var socket;
// jQuery handlers
(function ($) {
    socket = io.connect('http://wordmatch.org:4100');

    // Init slide
    var bxSlider = $('.game_content').bxSlider({
        slideWidth: 300,
        minSlides: 2,
        maxSlides: 2,
        moveSlides: 1,
        controls: false
    });

    // Setting
    $('#setting-save').on('touchstart, click', function () {
        var upDataOption = {
            gamePlay: $("input:checked").val()
        };
        $.post('/setting', upDataOption, function (data) {
            var url = "http://santinmoi.com:4100";
            $(location).attr('href', url);
        });
    });

    // Load sounds
    filter.loadSound();

    var player = Math.floor(Math.random() * 10);

    $('#bttName').on('click', function () {
        var userName = $('#name').val();
        socket.emit('username', userName);
        $(location).attr('href', "http://wordmatch.org:4100/multiplayer/random");
    });

})(jQuery);

