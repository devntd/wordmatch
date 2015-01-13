var express = require('express');
var router = express.Router();
var modelSchema = require('../models/Schema');
var Words = modelSchema.Words;

/* GET users listing. */
router.get('/', function (req, res) {
    res.render('users', {title: 'Words Battle | Users'});
});

router.post('/', function (req, res) {
    var word = req.body.submitWord;
    Words.findOne({'word': new RegExp('^' + word + '$', "i")}, function (err, word) {
        if (err) {
            return handleError(err);
        } else if (word) {
            res.send(word);
        } else {
            res.send(null);
        }
    });
});

/*router.get('/:words', function (req, res) {
 var queryWord = req.params.words;

 Words.findOne({'word': new RegExp('^' + queryWord + '$', "i")}, function (err, word) {
 if (err) return handleError(err);
 else if (word) {
 res.render('users', {title: 'Find one word', word: word});
 }
 });
 });*/

module.exports = router;
