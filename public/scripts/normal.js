// Global variables
CHAR_CODE_A = 'a'.charCodeAt(0);
CHAR_CODE_X = 'x'.charCodeAt(0);
CHAR_CODE_Z = 'z'.charCodeAt(0);
var SECONDS_PER_ROUND = 10;
var char = {current: 0, next: 0};
var countDownTimeout, inRoundFlag = false;
var passedWords = [], ownPassedWords = [], score = 0, timeRemaining;

(function ($) {
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
        if (inRoundFlag === false) {
            // Reset score
            $('.point').html(score = 0);
            // Clear data for new game
            char.current = CHAR_CODE_A;
            char.next = nextChar(char.current);
            passedWords.doClear();
            ownPassedWords.doClear();
            // First time start
            bxSlider.reloadSlider();
            $('.slide').removeClass('result-true result-false');
            $('.game_load').css('z-index', '0');
            // Start new game
            startRound();
        }
    });

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
        if (text.charCodeAt(0) !== char.current) {
            $('.slide:nth-child(' + (currentSlide + 2) + ')').addClass('result-false');
            gameOver('First letter does not match! Games Over!');
            return false;
        } else if (ownPassedWords.indexOf(text) !== -1) {
            $('.slide:nth-child(' + (currentSlide + 2) + ')').addClass('result-false');
            gameOver('Last word has already been submitted!');
            return false;
        }
        // If everything is ok, let's check
        var upData = {
            submitWord: text
        };
        if (upData.submitWord !== null && upData.submitWord !== '') {
            $.post('/check-word', upData, function (data) {
                if (filter.isObject(data) === true) {
                    // Calculate char
                    char.current = char.next;
                    char.next = nextChar(char.current);
                    ownPassedWords.push(text);
                    if ($.cookie('mute') == 0) ion.sound.play('right_answer');

                    // Set preview
                    $('.slide:nth-child(' + (currentSlide + 2) + ')').addClass('result-true');

                    // Set score
                    score += timeRemaining;
                    $('.point').html(score);

                    // Start new round
                    setTimeout(function () {
                        bxSlider.goToNextSlide();
                        startRound();
                    }, 1000);
                } else {
                    $('.slide:nth-child(' + (currentSlide + 2) + ')').addClass('result-false');
                    gameOver('Word submitted does not exist! Game Over!');
                    return false;
                }
            });
        }
    }

    function nextChar(current) {
        if (current !== (CHAR_CODE_X - 1) && current !== CHAR_CODE_Z)
            return current + 1;
        else if (current === CHAR_CODE_Z)
            return CHAR_CODE_A;
        return current + 2;
    }

    // x2
    $('#word_text').keyup(function (e) {
        var currentInput = getInput();
        if (inRoundFlag === true && e.which == 13 && currentInput !== '' && currentInput.length > 1) {
            endRound();
        } else if (inRoundFlag === true && e.which == 13 && currentInput === '') {
            $('#input-tooltip').tooltipster('content', 'Don\'t leave this input empty').tooltipster('show');
        } else if (inRoundFlag === true && e.which == 13 && currentInput.length < 2) {
            $('#input-tooltip').tooltipster('content', 'Word must contains at least 2 letters and not yet be submitted').tooltipster('show');
        } else {
            $('#input-tooltip').tooltipster('hide');
        }
    });

    // x2
    function startCountDown(time) {
        if (typeof time == 'number') {
            // Count down
            var seconds = parseInt(time);
            $('.mini').html(seconds);
            if (seconds == 0) {
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

    // x2
    function getInput() {
        return $('#word_text').val().trim().toLowerCase();
    }

    // x2
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
        $('#word_text').focus().val('').attr('placeholder', 'Enter word begins with ' + String.fromCharCode(char.current));
        inRoundFlag = true;
        startCountDown(SECONDS_PER_ROUND);
    }

    // x2
    function endRound() {
        checkInput(getInput());
        inRoundFlag = false;
        clearTimeout(countDownTimeout);
        $('#word_text').val('').blur();
        $('#input-tooltip').tooltipster('hide');
    }

    // x2
    function gameOver(error) {
        if ($.cookie('mute') == 0) ion.sound.play('wrong_answer');
        $('.game_load').css('z-index', '888');
        $('#word_text').attr('placeholder', 'Click Play to start');
        setTimeout(function () {
            $('.game_over').modal('show').find('.your-score').html(score);
        }, 500);
        console.log(error);
    }
})(jQuery);
