const { default: mongoose } = require("mongoose");

const admin = new mongoose.Schema({
    _id: String,
    list: Array,
});
const globalSettings = new mongoose.Schema({
    _id: String,
    Withdrawal: {
        CasinoPercent: Number,
    },
    GamesMaxBet: {
        Beginner: Number,
        Player: Number,
        Bronze: Number,
        Silver: Number,
        Gold: Number,
        PlatinumVIP: Number,
    },
    ProgramPercent: {
        Zero: Number,
        FiveHundreds: Number,
        OneThousandFiveHundred: Number,
    },
});
const users = new mongoose.Schema({
    _id: String,
    name: String,
});
const wallet = new mongoose.Schema({
    _id: String,
    amount: Number,
});
const status = new mongoose.Schema({
    _id: String,
    level_ru: String,
    level_en: String,
    monthly_spend: Number
});
const program = new mongoose.Schema({
    _id: String,
    code: String,
    count: Number,
    percent: Number,
    earning: Number,
    invited_by: String
});
const settings = new mongoose.Schema({
    _id: String,
    language: String,
    slots: {
        bet: Number,
        maxbet: Number,
    },
    dice: {
        bet: Number,
        maxbet: Number,
        position: Array,
    }
});
const gameSchema = new mongoose.Schema({
    id: String,
    status: String,
    creator: String,
    joined_player: String,
    bet: Number,
});
const payment = new mongoose.Schema({
    _id: String,
    id: String,
    currency: String,
    url: String,
    amount: Number,
    date: String,
    pay: Boolean
});
const Admin = mongoose.model('admins', admin);
const User = mongoose.model('users', users);
const Wallet = mongoose.model('wallets', wallet);
const Status = mongoose.model('statuses', status);
const Program = mongoose.model('program', program);
const Settings = mongoose.model('settings', settings);
const Payment = mongoose.model('payment', payment);
const Global = mongoose.model('globalsettings', globalSettings);

module.exports = {
    Admin,
    User,
    Wallet,
    Status,
    Program,
    Settings,
    Payment,
    Global,
};