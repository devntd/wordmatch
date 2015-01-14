/**
 * Variables
 */
var socket;

// Global variables
CHAR_CODE_A = 'a'.charCodeAt(0);
CHAR_CODE_X = 'x'.charCodeAt(0);
CHAR_CODE_Z = 'z'.charCodeAt(0);

var SECONDS_PER_ROUND = 10;
var SECONDS_PER_START = 3;

var countDownTimeout, inRoundFlag = false;
var passedWords = [], score = 0, timeRemaining;
var nowPlayer;

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

    /**
     * Socket handling
     */

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
        $.each(players, function (index, player) {
            $('.player-' + (index + 1)).html(player.name).addClass(player.socketId);
        });
    });

    socket.on('play game', function (roomName, players, firstLetter) {
        // Hide play button
        $('.game_load').css('z-index', '0');
        startCountDown(SECONDS_PER_START);
        inRoundFlag = true;
        // Check idFirst with socket.id
        nowPlayer = players.shift();
        //if (nowPlayer.socketId == socketId) {
        //
        //}
    });

    socket.on('send result', function (nextId, lastLetter, status) {
        // handle anything...............
    });

    socket.emit('typing', 'Word is typing');

    /**
     * Client handling
     */

        // Send word to server
    $('#word_text').keyup(function (e) {
        console.log(socketId);
        var currentInput = getInput();
        if (nowPlayer.socketId == socketId) {
            console.log('sau on  '+ nowPlayer);
            socket.emit('send word', currentInput);
        }
    });

    // x3
    function checkInput(text) {

    }

    // x3
    function startRound() {
        // Each time start
        var currentSlide = bxSlider.getCurrentSlide();
        $('.slide:nth-child(' + (currentSlide + 2) + ')').html(String.fromCharCode(char.current)).removeClass(function () {
            if (currentSlide === 0) return 'result-true';
        });
        setTimeout(function () {
            $('.slide:nth-child(' + (currentSlide + 3) + ')').html(String.fromCharCode(char.next)).removeClass(function () {
                if (currentSlide === 0) return 'result-true';
            });
        }, 1000);

        $('#word_text').focus().val('');
        inRoundFlag = true;
        startCountDown(SECONDS_PER_ROUND);
    }

    // x3
    function startCountDown(time) {
        if (typeof time == 'number') {
            // Count down
            var seconds = parseInt(time);
            $('.mini').html(seconds);
            if (seconds == 0) {
                ion.sound.play('bell_ring');
                endRound();
                return;
            }
            timeRemaining = seconds--;
            countDownTimeout = setTimeout(function () {
                if (seconds <= 3) ion.sound.play('tap');
                startCountDown(seconds);
            }, 1000);
        }
    }

    // x3
    function endRound() {
        checkInput(getInput());
        inRoundFlag = false;
        clearTimeout(countDownTimeout);
        $('#word_text').val('').blur();
        $('#input-tooltip').tooltipster('hide');
    }

    // x3
    function getInput() {
        return $('#word_text').val().trim().toLowerCase();
    }

    // x3
    function gameOver(error) {
        ion.sound.play('wrong_answer');
        $('.game_load').css('z-index', '888');
        setTimeout(function () {
            $('.game_over').modal('show').find('.your-score').html(score);
        }, 500);
        console.log(error);
    }
})(jQuery);