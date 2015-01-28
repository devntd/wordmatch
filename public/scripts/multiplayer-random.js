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
var defaultJoinedPlayers = null;

(function ($) {
    // Init socket
    socket = io.connect('http://wordmatch.org');
    defaultJoinedPlayers = $('.joined-players').html();

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
        // Clear data for new game
        clearData();
        $('.joined-player:first').html('<i class="fa fa-user"></i>&nbsp;' + $.cookie('playerName'));
        $('.joined-player:not(:first)').html('...');
        // Store socketID and request to join game
        socketID = socket.io.engine.id;
        // Waiting status
        if (!$(this).hasClass('stop-game-play')) {
            $(this).addClass('stop-game-play').html('Exit');
            if ($.cookie('mute') == 0) ion.sound.play('smb_kick');
            socket.emit('join game', $.cookie('playerName'), $.cookie('playerNumber'));
        } else {
            // Cancel game
            if ($.cookie('mute') == 0) ion.sound.play('smb_pause');
            $(this).removeClass('stop-game-play').html('Play');
            socket.emit('exit game', currentRoom, socketID);
        }
    });

    $('#exit-room').on('touchstart, click', function () {
        if ($.cookie('mute') == 0) ion.sound.play('smb_pause');
        $('.start-game-play').removeClass('stop-game-play').html('Play');
        $('.joined-player:first').html('<i class="fa fa-user"></i>&nbsp;' + $.cookie('playerName'));
        $('.joined-player:not(:first)').html('...');
        clearData();
        socket.emit('exit game', currentRoom, socketID);
    });


    socket.on('players changed', function (room, player, players) {
        if (player != null) {
            if (socketID != player.socketId && $.cookie('mute') == 0) ion.sound.play('smb_1-up');
            currentRoom = room;
            clientPlayer = player;
        }
        $('.joined-players').html(defaultJoinedPlayers);
        $.each(players, function (index, player) {
            $('.player-' + (index + 1)).html(((socketID == player.socketId) ? '<i class="fa fa-user"></i>&nbsp;' : '') + player.name).addClass(player.socketId);
        });
    });

    socket.on('play game', function (roomName, players, firstChar) {
        // Clear data at start of game
        clearData();
        // Hide play button
        $('.game_load').css('z-index', '0');
        // Set flag
        inRoundFlag = true;
        // Assign local data
        currentRoom = roomName;
        currentChar = firstChar;
        currentPlayers = players;
        currentPlayer = currentPlayers[0];
        // Start game
        startRoundCountDown(SECONDS_OF_PENDING);
    });

    socket.on('send result', function (roomName, players, randomChar, checkedWord, lostPlayer) {
        // Clear timeout all players
        clearTimeout(countDownTimeout);
        // Current slide
        var currentSlide = bxSlider.getCurrentSlide();
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
            // Set preview
            $('.slide:nth-child(' + (currentSlide + 2) + ')').addClass('result-true');
            if ($.cookie('mute') == 0) ion.sound.play('smb_coin');
            // Start new round
            setTimeout(function () {
                startRound();
            }, 1000);
        } else if (lostPlayer !== null && checkedWord === null && _.size(players) > 0) { // Incorrect result --> next player
            // New round data
            currentChar = randomChar;
            currentPlayers = players;
            currentPlayer = currentPlayers[0];
            // Highlight loser
            $('.joined-player.' + lostPlayer.socketId).addClass('lost');
            $('.slide:nth-child(' + (currentSlide + 2) + ')').addClass('result-false');
            if (socketID == lostPlayer.socketId) {
                if ($.cookie('mute') == 0) ion.sound.play('smb_mariodie');
                $('.game_over .modal-title').html('You lost!');
                gameOver('Word submitted does not exist! Game Over!');
            } else {
                if ($.cookie('mute') == 0) ion.sound.play('smb_bowserfalls');
                // Start new round
                setTimeout(function () {
                    startRound();
                }, 1000);
            }
        } else if (lostPlayer !== null && checkedWord !== null && _.size(players) == 0) { // Correct result from last player --> winner
            $('.joined-player.' + lostPlayer.socketId).addClass('won');
            $('.slide:nth-child(' + (currentSlide + 2) + ')').addClass('result-true');
            if ($.cookie('mute') == 0) ion.sound.play('smb_coin');
            if (socketID == lostPlayer.socketId) {
                $('.game_over .modal-title').html('Congrats! You won!');
                // Set score
                score += timeRemaining;
                $('.point').html(score);
                // End game
                gameOver('Congrats! Winner!');
                if ($.cookie('mute') == 0) ion.sound.play('smb_stage_clear');
                $('#continue-play').on('touchstart, click', function () {
                    socket.emit('game over', currentRoom, $.cookie('playerNumber'));
                });
            }
        } else if (lostPlayer !== null && checkedWord === null && _.size(players) == 0) { // Incorrect result from last player --> loser
            $('.joined-player.' + lostPlayer.socketId).addClass('almost-won');
            $('.slide:nth-child(' + (currentSlide + 2) + ')').addClass('result-false');
            if ($.cookie('mute') == 0) ion.sound.play('smb_mariodie');
            if (socketID == lostPlayer.socketId) {
                $('.game_over .modal-title').html('Congrats! You almost won!');
                gameOver('Congrats! Loser!');
                $('#continue-play').on('touchstart, click', function () {
                    socket.emit('game over', currentRoom, $.cookie('playerNumber'));
                });
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
            console.log('Wrong input!');
            return false;
        } else if (text.charCodeAt(0) !== currentChar) { // Words errors
            // Inform wrong word
            socket.emit('wrong word', currentRoom, currentPlayers);
            console.log('First letter does not match! Games Over!');
            return false;
        } else if (passedWords.indexOf(text) !== -1) {
            // Inform wrong word
            socket.emit('wrong word', currentRoom, currentPlayers);
            console.log('Last word has already been submitted!');
            return false;
        }

        // If everything is ok, let's check
        if (typeof text === 'string' && text.length > 1) {
            socket.emit('send word', currentRoom, currentPlayers, text);
        }
    }

    // Clear start data
    function clearData() {
        // Reset score
        $('.point').html(score = 0);
        $('.joined-player').removeClass('active lost won almost-won');
        $('.slide').removeClass('result-false result-true').html('-');
        // Clear and Init data
        passedWords.doClear();
        // Reload slider
        bxSlider.reloadSlider();
    }

    // x3
    function startRound() {
        // Each time start
        var currentSlide = bxSlider.getCurrentSlide();
        $('.slide:nth-child(' + (currentSlide + 2) + ')').removeClass(function () {
            if (currentSlide === 0) return 'result-true result-false';
        }).html(String.fromCharCode(currentChar));
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
            if (seconds >= 0) $('.mini').html(seconds); // Not print signed number
            if (seconds === 0 && currentPlayer.socketId == socketID) {
                if ($.cookie('mute') == 0) ion.sound.play('bell_ring');
                endRound();
                return;
            }
            timeRemaining = seconds--;
            countDownTimeout = setTimeout(function () {
                if (seconds <= 3 && $.cookie('mute') == 0) ion.sound.play('tap');
                startCountDown(seconds);
            }, 1000);
        }
    }

    // Countdown before start game
    function startRoundCountDown(time) {
        if (typeof time == 'number') {
            var seconds = parseInt(time);
            if (seconds >= 0) $('.mini').html(seconds); // Not print signed number
            if (seconds === 0) {
                startRound();
                return;
            }
            seconds--;
            setTimeout(function () {
                if ($.cookie('mute') == 0) ion.sound.play('tap');
                startRoundCountDown(seconds);
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
        $('.game_load').css('z-index', '888');
        setTimeout(function () {
            $('.game_over').modal('show').find('.your-score').html(score);
        }, 500);
        console.log(error);
    }
})(jQuery);
