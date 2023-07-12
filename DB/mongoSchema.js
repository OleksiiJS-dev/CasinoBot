const { default: mongoose } = require("mongoose");

const profileSchema = new mongoose.Schema({
    _id: String,
    id: String,
    user_name: String,
    promo: Number,
    profile: {
        first_name: String,
        last_name: String,
        full_name: String,
        status_en: String,
        status_ru: String,
        balance: Number,
    },
    referral_info: {
        referral_code: String,
        referral_balance_spend_with_one_link: Number,
        referral_balance: {
            balance_earned: Number,
            balance_withdrawn: Number,
        },
        referral_who_invited_id: String,
        referral_who_invited_referral_code: String,
    },
    balance: {
        withdrawn: Number,
        spend: Number,
        m_spend: Number,
    },
    game_info: {
        slot_bet: Number,

        slot_game_played: Number,
        slot_game_win: Number,
        slot_game_loss: Number,

        dice_bet: Number,
        dice_game_position: Array,
        dice_game_played: Number,
        dice_game_win: Number,
        dice_game_loss: Number,
        dice_game: {
            room: String,
        }

    },



});
const adminSchema = new mongoose.Schema({
    _id: String,
    id: String,
    user_name: String,
});

const allUsers = mongoose.model('allUsers', profileSchema);
const allAdmins = mongoose.model('admins', adminSchema);

module.exports = { allUsers , allAdmins };