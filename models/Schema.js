var mongoose = require('mongoose');

var WordSchema = new mongoose.Schema();

var RankSchema = new mongoose.Schema({
    name: String,
    score: Number,
    gamePlay: String
});

exports.Words = mongoose.model('Words', WordSchema);
exports.Ranks = mongoose.model('Ranks', RankSchema);
