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
        playerNumber: 2,
        playerName: 'Player',
        mute: 0
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

            if (req.cookies.mute) {
                req.session.mute = req.cookies.mute;
            } else {
                req.session.mute = setting.mute;
                res.cookie('mute', setting.mute);
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
                    playerName: req.session.playerName,
                    mute: req.session.mute
                })
            } else if (req.session.gamePlay === 'normal') {
                res.render('index', {
                    title: 'Word Match - Normal',
                    gamePlay: req.session.gamePlay,
                    playerNumber: req.session.playerNumber,
                    playerName: req.session.playerName,
                    mute: req.session.mute
                })
            } else {
                res.render('index', {
                    title: 'Word Match - Multiplayer',
                    gamePlay: req.session.gamePlay,
                    playerNumber: req.session.playerNumber,
                    playerName: req.session.playerName,
                    mute: req.session.mute
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

    // Get random char
    function randomChar() {
        var numberRan;
        do {
            numberRan = Math.floor(97 + Math.random() * 25);
        } while (numberRan === 120);
        return numberRan;
    }

    // Check exits room has status is 0 and size less 2 or less 4
    function returnRoom(rooms, playerNumber) {
        for (var roomName in rooms) {
            if (rooms.hasOwnProperty(roomName)) {
                var players = rooms[roomName].players;
                if (_.size(players) < playerNumber && rooms[roomName].status == 0 && rooms[roomName].playerNumber == playerNumber) {
                    return [roomName, players];
                }
            }
        }
        return [];
    }

    // Open connection socket
    io.on("connection", function (socket) {
        // Player request to join, start game when enough players
        socket.on('join game', function (name, playerNumber) {
            console.log('aaaaaaaaaaabbbbbbbbbbbbb');
            var player = {'socketId': socket.id, 'name': name, 'status': 1};
            if (_.isEmpty(rooms)) {
                var id = uuid.v4();
                socket.room = id;
                socket.join(socket.room);
                var room = [];
                room.push(player);
                rooms[id] = {'players': room, 'status': 0, 'nowPlaying': [], 'playerNumber': playerNumber};
                io.sockets.in(socket.room).emit('players changed', id, player, rooms[id]);
            } else {
                if (_.isEmpty(returnRoom(rooms, playerNumber))) {
                    var id = uuid.v4();
                    socket.room = id;
                    socket.join(socket.room);
                    var room = [];
                    room.push(player);
                    rooms[id] = {'players': room, 'status': 0, 'nowPlaying': [], 'playerNumber': playerNumber};
                    io.sockets.in(socket.room).emit('players changed', id, player, rooms[id]);
                } else {
                    var listRoom = returnRoom(rooms, playerNumber);
                    var players = listRoom[1];
                    socket.room = listRoom[0];
                    socket.join(socket.room);
                    players.push(player);
                    // Players number changed
                    io.sockets.in(socket.room).emit('players changed', socket.room, player, players);
                    // Enough players, let's play
                    if (_.size(players) == playerNumber) {
                        rooms[socket.room].status = 1;
                        rooms[socket.room].nowPlaying = players;
                        io.sockets.in(socket.room).emit('play game', socket.room, players, randomChar());
                    }
                }
            }
        });

        socket.on('game over', function (roomName, playerNumber) {
            if (_.size(rooms[roomName].players) == playerNumber) {
                io.sockets.in(roomName).emit('play game', roomName, rooms[roomName].players, randomChar());
            } else {
                rooms[roomName].status = 0;
            }
        });

        // Players send their words
        socket.on('send word', function (roomName, players, sentWord) {
            Words.findOne({'word': new RegExp('^' + sentWord + '$', "i")}, function (err, queriedWord) {
                var loser = null;
                if (err) {
                    return handleError(err);
                } else if (queriedWord) {
                    if (_.size(players) === 1) {
                        loser = players.pop();
                        rooms[roomName].nowPlaying = players;
                        io.sockets.in(roomName).emit('send result', roomName, rooms[roomName].nowPlaying, randomChar(), queriedWord.toObject().word, loser);
                    } else {
                        rooms[roomName].nowPlaying = players;
                        io.sockets.in(roomName).emit('send result', roomName, rooms[roomName].nowPlaying, randomChar(), queriedWord.toObject().word, null);
                    }
                } else {
                    loser = players.pop();
                    rooms[roomName].nowPlaying = players;
                    io.sockets.in(roomName).emit('send result', roomName, rooms[roomName].nowPlaying, randomChar(), null, loser);
                }
            });
        });

        socket.on('wrong word', function (roomName, players) {
            var lostPlayer = players.pop();
            rooms[roomName].nowPlaying = players;
            io.sockets.in(roomName).emit('send result', roomName, rooms[roomName].nowPlaying, randomChar(), null, lostPlayer);
        });

        socket.on('typing', function (roomName, text) {
            io.sockets.in(roomName).emit('send typing', text);
        });

        // exit game
        socket.on('exit game', function (roomName, socketIdClient) {
            if (!_.isEmpty(rooms[roomName].players)) {
                socket.leave(roomName);
                rooms[roomName].players = _.without(rooms[roomName].players, _.findWhere(rooms[roomName].players, {socketId: socketIdClient}));
                io.sockets.in(roomName).emit('players changed', roomName, null, rooms[roomName].players);
            }
        });

        // Disconnect
        socket.on('disconnect', function () {

            if (!_.isUndefined(socket.room)) {
                var clientRoom = socket.room;
                socket.leave(socket.room);
                if (rooms[clientRoom].status == 1 && !_.isEmpty(rooms[clientRoom].nowPlaying)) {
                    if (socket.id == rooms[clientRoom].nowPlaying[0].socketId) {
                        rooms[clientRoom].nowPlaying.push(rooms[clientRoom].nowPlaying.shift());
                        var loser = rooms[clientRoom].nowPlaying.pop();
                        setTimeout(function () {
                            io.sockets.in(clientRoom).emit('send result', clientRoom, rooms[clientRoom].nowPlaying, randomChar(), null, loser);
                            return;
                        }, 3000);
                    } else {
                        rooms[clientRoom].nowPlaying = _.without(rooms[clientRoom].nowPlaying, _.findWhere(rooms[clientRoom].nowPlaying, {socketId: socket.id}));
                        io.sockets.in(clientRoom).emit('send exit', rooms[clientRoom].nowPlaying);
                    }
                }
                rooms[clientRoom].players = _.without(rooms[clientRoom].players, _.findWhere(rooms[clientRoom].players, {socketId: socket.id}));
                console.log(rooms[clientRoom]);
                io.sockets.in(clientRoom).emit('players changed', clientRoom, null, rooms[clientRoom].players);
            }
        });
    });

    return router;
};
