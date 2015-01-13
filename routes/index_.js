var express = require('express');
var router = express.Router();
var modelSchema = require('../models/Schema');
var uuid = require('node-uuid')
var Room = require('./room');
var _ = require('underscore')._;
module.exports = function (io) {
    var Words = modelSchema.Words;
    var Ranks = modelSchema.Ranks;
    var setting = {
        gamePlay: 'random',
        playerNumber: 'two',
        playerName: 'Player'
    };

    // Variable multi-player
    var rooms = {};
    var players = {};
    var sockets = [];

    // Home page
    router.get('/', function (req, res) {
        // Game Play
        if (req.cookies.gamePlay) {
            setting.gamePlay = req.cookies.gamePlay;
        }
        // Players number
        if (req.cookies.playerNumber) {
            setting.playerNumber = req.cookies.playerNumber;
        }
        // Player name
        if (req.cookies.playerName) {
            setting.playerName = req.cookies.playerName;
        }

        if (setting.gamePlay === 'random') {
            res.render('index', {
                title: 'Word Match - Random', gamePlay: setting.gamePlay, playerNumber: setting.playerNumber,
                playerName: setting.playerName
            })
        } else {
            if (setting.gamePlay === 'normal') {
                res.render('index', {
                    title: 'Word Match - Normal', gamePlay: setting.gamePlay, playerNumber: setting.playerNumber,
                    playerName: setting.playerName
                })
            } else {
                io.sockets.on('connection', function (socket) {
                    socket.on('join game', function () {
                        var listRoom = [];
                        //if (!_.contains(sockets, socket.id)) {
                        sockets.push(socket.id);
                        //}
                        console.log(sockets);
                        if (rooms !== "null") {
                            for (var a in rooms) {
                                if (rooms[a].playersInRoom < 3) {
                                    listRoom.push(a);
                                    //console.log(rooms[a].playersInRoom);
                                    //console.log(listRoom);
                                }
                            }
                            if (listRoom.length > 0) {
                                var num = Math.floor(Math.random() * listRoom.length);
                                rooms[listRoom[num]].addPlayer(socket.id);
                            } else {
                                var id = uuid.v4();
                                var room = new Room(id, 4);
                                room.addPlayer(socket.id);
                                rooms[id] = room;
                            }
                        } else {
                            var id = uuid.v4();
                            var room = new Room(id, 4);
                            room.addPlayer(socket.id);
                            rooms[id] = room;
                        }


                        socket.emit('join', rooms);
                    });
                });
                res.render('index', {
                    title: 'Word Match - Multiplayer',
                    gamePlay: setting.gamePlay,
                    playerNumber: setting.playerNumber,
                    playerName: setting.playerName
                })
            }
        }
        //res.render('index', {
        //
        //    title: (setting.gamePlay === 'random') ? 'Word Match - Random' : 'Word Match - Normal',
        //    gamePlay: setting.gamePlay
        //});
    });


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
                gamePlay: setting.gamePlay,
                name: req.body.name,
                score: req.body.score
            });

            rankPlayer.save(function (err) {
                if (err) {
                    return err
                } else {
                    Ranks.find({gamePlay: setting.gamePlay}).sort({score: 'descending'}).limit(10).exec(function (err, ranks) {
                        if (err) {
                            return handleError(err);
                        } else {
                            res.send(ranks);
                        }
                    });
                }
            });
        } else {
            Ranks.find({gamePlay: setting.gamePlay}).sort({score: 'descending'}).limit(10).exec(function (err, ranks) {
                if (err) {
                    return handleError(err);
                } else {
                    res.send(ranks);
                }
            });
        }
    });
    return router;
};
