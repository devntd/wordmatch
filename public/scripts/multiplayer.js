/**
 * Created by dung on 12/25/2014.
 */
var score = 0;
var socket;
(function ($) {
    socket = io.connect('http://wordmatch.org:4100');
    var socketId;

    // Init slide
    var bxSlider = $('.game_content').bxSlider({
        slideWidth: 600,
        minSlides: 1,
        maxSlides: 1,
        moveSlides: 1,
        controls: false,
        autoDelay: 200
    });

    $('.start-game-play').on('touchstart, click', function () {
        socketId = socket.io.engine.id;
        socket.emit('join game', $.cookie('playerName'));
        if (!$(this).hasClass('stop-game-play')) {
            $(this).addClass('stop-game-play').html('Stop');
        } else {
            $(this).removeClass('stop-game-play').html('Play');
            socket.emit('exit game');
        }
    });

    socket.on('players changed', function (players) {
        console.log(players);
    });

    socket.on('play game', function (players, firstId, firstLetter) {
        // Hide play button
        $('.game_load').css('z-index', '0');

        // Check idFirst with socket.id
        if (firstId == socketId) {
            // handle anything..................

            // get Word from word_text
            var word;
            socket.emit('send word', word);
        }
    });


    socket.on('send result', function (nextId, lastLetter, status) {
        // handle anything...............

        var word;
        socket.emit('send word', word);
    });

    socket.emit('typing', 'Word is typing');
})(jQuery);