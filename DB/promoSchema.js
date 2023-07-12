const { default: mongoose } = require("mongoose");

const promoSchema = new mongoose.Schema({
    code: String,
    value: Number,
    status: String,
    date: {
        creation: Date,
        expire: Date,
    },
    used_by: String,
    used_by_id: String, 
});

const promocodes = mongoose.model('promocodes', promoSchema);

module.exports = { promocodes };