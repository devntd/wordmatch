/**
 * Created by dung on 12/25/2014.
 */
var score = 0;
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
            socket.emit('play game', text)
        }
    });

    socket.on('update rooms', function (data1, data2) {
        console.log('Socket: ' + data1 + ': ' + data2);
    });

})(jQuery);