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
var socketID, currentPlayer, currentPlayers = [], currentChar = 0, currentRoom, clientPlayer;

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

        // Waiting status
        if (!$(this).hasClass('stop-game-play')) {
            $(this).addClass('stop-game-play').html('Stop');
            socket.emit('join game', $.cookie('playerName'));
        } else {
            // Cancel game
            $(this).removeClass('stop-game-play').html('Play');
            socket.emit('exit game', currentRoom, clientPlayer);
        }
    });

    socket.on('players changed', function (room, player, players) {
        currentRoom = room;
        clientPlayer = player;
        $.each(players, function (index, player) {
            $('.player-' + (index + 1)).html(player.name).addClass(player.socketId);
        });
    });

    socket.on('play game', function (roomName, players, firstChar) {
        // Reset score
        $('.point').html(score = 0);
        // Hide play button
        $('.game_load').css('z-index', '0');
        // Clear and Init data
        passedWords.doClear();
        inRoundFlag = true;
        // Assign local data
        currentRoom = roomName;
        currentChar = firstChar;
        currentPlayers = players;
        currentPlayer = currentPlayers[0];
        // Start game
        startRound();
    });

    socket.on('send result', function (roomName, players, randomChar, checkedWord, lostPlayer) {
        // Clear timeout all players
        clearTimeout(countDownTimeout);
        // Check result
        if (lostPlayer === null && checkedWord !== null && _.size(players) > 0) { // Correct result --> next player
            // New round data
            currentChar = randomChar;
            currentPlayers = players;
            currentPlayer = currentPlayers[0];
            // Push passed word into stack
            passedWords.push(checkedWord);
            // Set score to the last player (after swap)
            if (socketID == players[players.length - 1].socketId) {
                score += timeRemaining;
                $('.point').html(score);
            }
            // Start new round
            startRound();
        } else if (lostPlayer !== null && checkedWord === null && _.size(players) > 0) { // Incorrect result --> next player
            // New round data
            currentChar = randomChar;
            currentPlayers = players;
            currentPlayer = currentPlayers[0];
            // Highlight loser
            $('.joined-player.' + lostPlayer.socketId).addClass('lost');
            if (socketID == lostPlayer.socketId) {
                $('.game_over .modal-title').html('You lost!');
                gameOver('Word submitted does not exist! Game Over!');
            } else {
                // Start new round
                startRound();
            }
        } else if (lostPlayer !== null && checkedWord !== null && _.size(players) == 0) { // Correct result from last player --> winner
            $('.joined-player.' + lostPlayer.socketId).addClass('lost');
            if (socketID == lostPlayer.socketId) {
                $('.game_over .modal-title').html('Congrats! You won!');
                socket.emit('game over');
                // Set score
                score += timeRemaining;
                $('.point').html(score);
                // End game
                gameOver('Congrats! Winner!');
            }
        } else if (lostPlayer !== null && checkedWord === null && _.size(players) == 0) { // Incorrect result from last player --> loser
            if (socketID == lostPlayer.socketId) {
                $('.game_over .modal-title').html('Congrats! You almost won!');
                socket.emit('game over');
                gameOver('Congrats! Loser!');
            }
        }
    });

    // Send word to server
    $('#word_text').keyup(function (e) {
        var currentInput = getInput();
        socket.emit('typing', currentRoom, currentInput);
        if (currentPlayer.socketId == socketID && inRoundFlag === true && e.which == 13 && typeof currentInput === 'string' && currentInput.length > 1) {
            endRound();
        } else if (currentPlayer.socketId == socketID && inRoundFlag === true && e.which == 13 && typeof currentInput === 'string') {
            $('#input-tooltip').tooltipster('content', 'Don\'t leave this input empty').tooltipster('show');
        } else if (currentPlayer.socketId == socketID && inRoundFlag === true && e.which == 13 && currentInput.length < 2) {
            $('#input-tooltip').tooltipster('content', 'Word must contains at least 2 letters and not yet be submitted').tooltipster('show');
        } else {
            $('#input-tooltip').tooltipster('hide');
        }
    });

    socket.on('send typing', function (text) {
        if (currentPlayer.socketId != socketID) $('#word_text').val(text);
    });

    // x3
    function checkInput(text) {
        // User errors --> Don't allow to send request to server
        if (typeof text !== 'string' || text === '' || inRoundFlag !== true || text.length < 2) {
            // Inform wrong word
            socket.emit('wrong word', currentRoom, currentPlayers);
            gameOver('Wrong input!');
            return false;
        } else if (text.charCodeAt(0) !== currentChar) { // Words errors
            // Inform wrong word
            socket.emit('wrong word', currentRoom, currentPlayers);
            gameOver('First letter does not match! Games Over!');
            return false;
        } else if (passedWords.indexOf(text) !== -1) {
            // Inform wrong word
            socket.emit('wrong word', currentRoom, currentPlayers);
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
        // Change current user highlight
        $('.joined-player').removeClass('active');
        $('.joined-player.' + currentPlayer.socketId).addClass('active');
        // Focus on the input
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
            if (seconds === 0 && currentPlayer.socketId == socketID) {
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
        // Change players order
        currentPlayers.push(currentPlayers.shift());
        // Check word
        checkInput(getInput());
        // End round
        inRoundFlag = false;
        $('#word_text').val('').blur();
        $('#input-tooltip').tooltipster('hide');
    }

    // x3
    function getInput() {
        return $('#word_text').val().trim().toLowerCase();
    }

    // x3
    function gameOver(error) {
        // Client's UI
        $('.slide:nth-child(' + (bxSlider.getCurrentSlide() + 2) + ')').addClass('result-false');
        ion.sound.play('wrong_answer');
        $('.game_load').css('z-index', '888');
        setTimeout(function () {
            $('.game_over').modal('show').find('.your-score').html(score);
        }, 500);
        console.log(error);
    }
})(jQuery);