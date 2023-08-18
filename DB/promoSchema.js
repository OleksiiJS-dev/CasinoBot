const { default: mongoose } = require("mongoose");

const promoSchema = new mongoose.Schema({
    _id: String,
    promocode: {
        code: String,
        value: Number,
        status: String,
        date: {
            creation: Date,
            expire: Date,
        },
        used: {
            id: String,
        },
    },
});

const promocodes = mongoose.model('promocodes', promoSchema);

module.exports = { promocodes };