/**
 * Variables
 */
var socket;

CHAR_CODE_A = 'a'.charCodeAt(0);
CHAR_CODE_X = 'x'.charCodeAt(0);
CHAR_CODE_Z = 'z'.charCodeAt(0);

var SECONDS_PER_ROUND = 10;
var SECONDS_OF_PENDING = 3;

var countDownTimeout, inRoundFlag = false;
var passedWords = [], score = 0, timeRemaining;
var socketID, currentPlayer, currentPlayers = [], currentChar = 0, currentRoom;

(function ($) {
    // Init socket
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

    $('.start-game-play').on('touchstart, click', function () {
        // Store socketID and request to join game
        socketID = socket.io.engine.id;
        socket.emit('join game', $.cookie('playerName'));
        // Waiting status
        if (!$(this).hasClass('stop-game-play')) {
            $(this).addClass('stop-game-play').html('Stop');
        } else {
            // Cancel game
            $(this).removeClass('stop-game-play').html('Play');
            socket.emit('exit game');
        }
    });

    socket.on('players changed', function (players) {
        $.each(players, function (index, player) {
            $('.player-' + (index + 1)).html(player.name).addClass(player.socketId);
        });
    });

    socket.on('play game', function (roomName, players, firstChar) {
        // Hide play button
        $('.game_load').css('z-index', '0');
        // Clear and Init data
        passedWords.doClear();
        inRoundFlag = true;
        // Assign local data
        currentRoom = roomName;
        currentChar = firstChar;
        currentPlayer = players[0];
        currentPlayers = players;
        // Start game
        startRound();
    });

    socket.on('send result', function (roomName, players, lastChar) {
        // handle anything...............
        console.log(players);
    });

    socket.emit('typing', getInput());

    // Send word to server
    $('#word_text').keyup(function (e) {
        var currentInput = getInput();
        if (currentPlayer.socketId == socketID && inRoundFlag === true && e.which == 13 && currentInput !== '' && currentInput.length > 1) {
            endRound();
        } else if (currentPlayer.socketId == socketID && inRoundFlag === true && e.which == 13 && currentInput === '') {
            $('#input-tooltip').tooltipster('content', 'Don\'t leave this input empty').tooltipster('show');
        } else if (currentPlayer.socketId == socketID && inRoundFlag === true && e.which == 13 && currentInput.length < 2) {
            $('#input-tooltip').tooltipster('content', 'Word must contains at least 2 letters and not yet be submitted').tooltipster('show');
        } else {
            $('#input-tooltip').tooltipster('hide');
        }
    });

    // x3
    function checkInput(text) {
        // Current slide
        var currentSlide = bxSlider.getCurrentSlide();
        // User errors --> Don't allow to send request to server
        if (typeof text !== 'string' || text === '' || inRoundFlag !== true || text.length < 2) {
            $('.slide:nth-child(' + (currentSlide + 2) + ')').addClass('result-false');
            gameOver('Wrong input!');
            return false;
        }
        // Words errors
        if (text.charCodeAt(0) !== currentChar) {
            $('.slide:nth-child(' + (currentSlide + 2) + ')').addClass('result-false');
            gameOver('First letter does not match! Games Over!');
            return false;
        } else if (passedWords.indexOf(text) !== -1) {
            $('.slide:nth-child(' + (currentSlide + 2) + ')').addClass('result-false');
            gameOver('Last word has already been submitted!');
            return false;
        }

        // If everything is ok, let's check
        if (typeof text === 'string' && text.length > 1) {
            socket.emit('send word', currentRoom, currentPlayers, text);
        }
    }

    // x3
    function startRound() {
        // Each time start
        var currentSlide = bxSlider.getCurrentSlide();
        $('.slide:nth-child(' + (currentSlide + 2) + ')').html(String.fromCharCode(currentChar)).removeClass(function () {
            if (currentSlide === 0) return 'result-true';
        });
        /*setTimeout(function () {
         $('.slide:nth-child(' + (currentSlide + 3) + ')').html(String.fromCharCode(char.next)).removeClass(function () {
         if (currentSlide === 0) return 'result-true';
         });
         }, 1000);*/
        $('#word_text').focus().val('');
        inRoundFlag = true;
        //startCountDown(SECONDS_PER_ROUND);
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
        currentPlayer = currentPlayers.shift();
        currentPlayers.push(currentPlayer);
        inRoundFlag = false;
        clearTimeout(countDownTimeout);
        $('#word_text').val('').blur();
        $('#input-tooltip').tooltipster('hide');
        checkInput(getInput());
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