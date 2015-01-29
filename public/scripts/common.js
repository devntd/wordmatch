var minScore = 0, playerHighScore = 0;

(function ($) {
    // Init Score Board
    updateScoreBoard(null);
    //$('.game_over').modal('show');

    // Load sounds
    filter.loadSound();

    // ScrollTop when focus
    $('#word_text').on('focus', function () {
        if ($(window).width() <= 767) $(window).scrollTop($('.game-control').offset().top - 40);
    });

    // Tooltip
    $('.tooltip').tooltipster({
        animation: 'fade',
        delay: 200,
        theme: 'tooltipster-shadow',
        position: 'bottom-left'
    });

    // Setting
    $('#setting-save').on('touchstart, click', function () {
        var settings = {
            gamePlay: $('input[type=radio][name=optionsRadios]:checked').val(),
            playerNumber: $('input[type=radio][name=inlineRadioOptions]:checked').val(),
            playerName: $('#name-player').val()
        };

        if ((settings.gamePlay === 'multiplayer-random' && typeof settings.playerName === 'string' && settings.playerName.length >= 3) || settings.gamePlay !== 'multiplayer-random') {
            $('#name-player-tooltip').tooltipster('hide');
            $.post('/setting', settings, function () {
                $(location).attr('href', 'http://wordmatch.org');
            });
        } else if (settings.gamePlay === 'multiplayer-random' && (typeof settings.playerName !== 'string' || settings.playerName < 3)) {
            $('#name-player-tooltip').tooltipster('content', 'Please enter your name with at least 3 letters').tooltipster('show');
        }
    });

    $('#name-player').keyup(function (e) {
        $('#name-player-tooltip').tooltipster('hide');
        if (e.which == 13) {
            $('#setting-save').trigger('touchstart, click');
        }
    });

    $('.setting-volume img').attr('src', function () {
        if ($.cookie('mute') == 0) return 'images/volume_on.png';
        return 'images/volume_off.png';
    }).on('touchstart, click', function () {
        if ($.cookie('mute') == 0) {
            $(this).attr('src', 'images/volume_off.png');
            $.cookie('mute', 1);
        } else {
            $(this).attr('src', 'images/volume_on.png');
            $.cookie('mute', 0);
        }
    });

    // Social share
    $('.facebook').on('touchstart, click', function () {
        var link = $(this).attr('data-href') + btoa($.cookie('gamePlay') + '-' + score);
        social.popupWindow(link, "Share with Friends", 700, 500);
    });

    // Modal events
    $('.game_over').on('shown.bs.modal', function () {
        if ($.cookie("playerName") !== 'Player') $('#player-name-input').val($.cookie("playerName"));
    }).on('hidden.bs.modal', function () {
        $('#input-name-tooltip').tooltipster('hide');
    });

    $('.game-settings').on('shown.bs.modal', function () {
        if ($.cookie("playerName") !== 'Player') $('#name-player').val($.cookie("playerName"));
    }).on('hidden.bs.modal', function () {
        $('#name-player-tooltip').tooltipster('hide');
    });

    // Save name and score
    $('#player-name-input').keyup(function (e) {
        var name = $('#player-name-input').val().trim();
        if (e.which === 13 && name !== '' && score > minScore) {
            updateScoreBoard({name: name, score: score, passedWords: passedWords});
            $.cookie("playerName", name);
        } else if (e.which === 13 && (name === '' || score <= minScore || _.empty(passedWords) || "[^~`!#$%\^&*+=\-\[\]\\';,/{}|\\\":<>\?]".test(name))) {
            $('#input-name-tooltip').tooltipster('content', 'Reach score higher than ' + minScore + ' then enter your name to submit').tooltipster('show');
        } else {
            $('#input-name-tooltip').tooltipster('hide');
        }
    });
    // Update score board
    function updateScoreBoard(req) {
        $.post('/add-score', req, function (data) {
            // Get min score for submit
            if (typeof data[data.length - 1] !== 'undefined') {
                if (playerHighScore < score) playerHighScore = score;
                minScore = (data[data.length - 1].score < playerHighScore) ? playerHighScore : data[data.length - 1].score;
                // Update score board
                $('#table-rank').html('<tr><th>Rank</th><th>Players</th><th>Score</th></tr>').append(function () {
                    var scoreBoard = '';
                    for (var i = 0; i < data.length; i++) {
                        scoreBoard += '<tr><td>' + (i + 1) + '</td><td>' + data[i].name + '</td><td>' + data[i].score + '</td></tr>';
                    }
                    return scoreBoard;
                });
                // Success
                updateScoreSuccess();
            }
        });
    }

    // Success update score
    function updateScoreSuccess() {
        $('.add-success').fadeIn(300);
        setTimeout(function () {
            $('.add-success').fadeOut(1000);
        }, 2000);
    }
})(jQuery);