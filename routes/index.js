var express = require('express');
var router = express.Router();
var modelSchema = require('../models/Schema');
var uuid = require('node-uuid');
var _ = require('underscore')._;
module.exports = function (io) {
    var Words = modelSchema.Words;
    var Ranks = modelSchema.Ranks;

    // Settings
    var setting = {
        gamePlay: 'random',
        playerNumber: 4,
        playerName: 'Player'
    };

    var rooms = {};
    var players = {};
    // Home page
    router.get('/', function (req, res) {
            // Init cookies and sessions
            if (req.cookies.gamePlay) {
                req.session.gamePlay = req.cookies.gamePlay;
            } else {
                req.session.gamePlay = setting.gamePlay;
                res.cookie('gamePlay', setting.gamePlay);
            }

            if (req.cookies.playerNumber) {
                req.session.playerNumber = req.cookies.playerNumber;
            } else {
                req.session.playerNumber = setting.playerNumber;
                res.cookie('playerNumber', setting.playerNumber);
            }

            if (req.cookies.playerName) {
                req.session.playerName = req.cookies.playerName;
            } else {
                req.session.playerName = setting.playerName;
                res.cookie('playerName', setting.playerName);
            }

            if (req.session.gamePlay === 'random') {
                res.render('index', {
                    title: 'Word Match - Random',
                    gamePlay: req.session.gamePlay,
                    playerNumber: req.session.playerNumber,
                    playerName: req.session.playerName
                })
            } else if (req.session.gamePlay === 'normal') {
                res.render('index', {
                    title: 'Word Match - Normal',
                    gamePlay: req.session.gamePlay,
                    playerNumber: req.session.playerNumber,
                    playerName: req.session.playerName
                })
            } else {
                res.render('index', {
                    title: 'Word Match - Multiplayer',
                    gamePlay: req.session.gamePlay,
                    playerNumber: req.session.playerNumber,
                    playerName: req.session.playerName
                });
            }
        }
    );

    // Result page
    router.get('/result', function (req, res) {
        res.redirect('/');
    });

    // Social share
    router.get('/result/:info', function (req, res) {
        // base64 decode
        var info = new Buffer(req.params.info, 'base64').toString('ascii').split('-');
        // Render to client
        res.render('result', {
            info: req.params.info,
            gamePlay: info[0],
            score: info[1]
        });
    });

    // Check input word
    router.post('/check-word', function (req, res) {
        var txtWord = req.body.submitWord;
        Words.findOne({'word': new RegExp('^' + txtWord + '$', "i")}, function (err, word) {
            if (err) {
                return handleError(err);
            } else if (word) {
                res.send(word);
                req.session.char = txtWord.slice(0, 1);
                req.session.save();
            } else {
                res.send(word);
            }
        });
    });

    // Set cookies
    router.post('/setting', function (req, res) {
        res.cookie('gamePlay', req.body.gamePlay);
        res.cookie('playerNumber', req.body.playerNumber);
        res.cookie('playerName', req.body.playerName);
        res.send(req.body.gamePlay);
    });

    // Score board
    router.post('/add-score', function (req, res) {
        if (typeof req.body.name === 'string' && req.body.name !== '' && req.body.score !== '0') {
            var rankPlayer = new Ranks({
                gamePlay: req.session.gamePlay,
                name: req.body.name,
                score: req.body.score
            });

            rankPlayer.save(function (err) {
                if (err) {
                    return err
                } else {
                    Ranks.find({gamePlay: req.session.gamePlay}).sort({score: 'descending'}).limit(10).exec(function (err, ranks) {
                        if (err) {
                            return handleError(err);
                        } else {
                            res.send(ranks);
                        }
                    });
                }
            });
        } else {
            Ranks.find({gamePlay: req.session.gamePlay}).sort({score: 'descending'}).limit(10).exec(function (err, ranks) {
                if (err) {
                    return handleError(err);
                } else {
                    res.send(ranks);
                }
            });
        }
    });

    function randomChar() {
        var numberRan;
        do {
            numberRan = Math.floor(97 + Math.random() * 25);
        } while (numberRan === 120);
        return numberRan;
    }

    io.on("connection", function (socket) {
        // Player request to join, start game when enough players
        socket.on('join game', function (name) {
            var player = {'socketId': socket.id, 'name': name, 'status': 1};
            if (_.isEmpty(rooms)) {
                var id = uuid.v4();
                socket.room = id;
                socket.join(socket.room);
                var room = [];
                room.push(player);
                rooms[id] = room;
                io.sockets.in(socket.room).emit('players changed', id, player, rooms[id]);
            } else {
                for (var roomName in rooms) {
                    if (rooms.hasOwnProperty(roomName)) {
                        var players = rooms[roomName];
                        if (_.size(players) < 2) {
                            socket.room = roomName;
                            socket.join(socket.room);
                            players.push(player);
                            // Players number changed
                            io.sockets.in(socket.room).emit('players changed', roomName, player, players);
                            // Enough players, let's play
                            if (_.size(players) == 2) io.sockets.in(socket.room).emit('play game', roomName, players, randomChar());
                            break;
                        }
                    }
                }
            }
        });
        // Players send their words
        socket.on('send word', function (roomName, players, sentWord) {
            Words.findOne({'word': new RegExp('^' + sentWord + '$', "i")}, function (err, queriedWord) {
                if (err) {
                    return handleError(err);
                } else {
                    console.log(queriedWord);
                    var playerWrong = (!queriedWord) ? players.pop() : null;
                    io.sockets.in(roomName).emit('send result', roomName, players, randomChar(), playerWrong);
                }
            });
        });

        socket.on('typing', function (roomName, text) {
            console.log(text);
            //socket.broadcast.to('roomName').emit('send typing', text);
            io.sockets.in(roomName).emit('send typing', text);
        });
        socket.on('exit game', function (roomName, clientPlayer) {
            console.log(rooms);
            console.log(roomName);
            rooms[roomName] = _.without(rooms[roomName], _.findWhere(rooms[roomName], clientPlayer));
            console.log(rooms);
        });

        // Disconnect
        socket.on('disconnect', function () {
            // sth goes here
            socket.leave(socket.room);
        });
    });

    return router;
}
;
