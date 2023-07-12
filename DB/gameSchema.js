const { default: mongoose } = require("mongoose");

const gameSchema = new mongoose.Schema({
    id: String,
    status: String,
    creator: String,
    joined_player: String,
    bet: Number,
    
});

const game = mongoose.model('games', gameSchema);

module.exports = { game };