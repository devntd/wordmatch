/**
 * Created by dung on 12/25/2014.
 */
var express = require('express');
var router = express.Router();

var player = 1;
var countUser = 0;
module.exports = function (io) {
    var arrayUser = [];
    router.get('/', function (req, res) {
        res.render('multiplayer', {title: 'Word match multiplayer', gamePlay: 'random'});
    });

    router.get('/random', function (req, res) {
        io.on('connection', function (socket) {
            socket.on('username', function (data) {
                arrayUser.push(data);
            });
        });
        console.log(arrayUser);
        res.render('ran',{title: 'Word match multiplayer random', gamePlay: 'random'});
    });

    return router;
};
