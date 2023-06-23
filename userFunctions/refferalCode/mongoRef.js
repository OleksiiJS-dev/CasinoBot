const { default: mongoose } = require("mongoose");

const profileSchema = new mongoose.Schema({
    _id: String,
    id: String,
    user_name: String,
    profile: {
        first_name: String,
        last_name: String,
        full_name: String,
        status_en: String,
        status_ru: String,
        balance: Number,
        referral: String,
    },
    game_info: {
        slot_game_played: Number,
        slot_game_win: Number,
        slot_game_loss: Number,
        dice_game_played: Number,
        dice_game_win: Number,
        dice_game_loss: Number,

    },
    ref_info: {
        referral_code: String,
        referral_invited_people: Array,
        referral_invited_people_count: Number,

        refrral_balance: {
            balance: Number,
            balance_withdrawn: Number,
        },

        referral_who_invited_id: String,
        referral_who_invited_referral_code: String,
    },
    balance: {
        withdrawn: Number,
        spend: Number,
        balance: Number,
    },



});

const allUsers = mongoose.model('allUsers', profileSchema);

module.exports = { allUsers };