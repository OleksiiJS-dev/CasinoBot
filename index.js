require('dotenv').config();
const Bot = require('node-telegram-bot-api');
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new Bot(token, { polling: true });
const { allUsers } = require('./userFunctions/refferalCode/mongoRef');
const mongoose = require('mongoose');
const mongooseUrl = process.env.MONGODB_URL;
// Crypto Pay Api
const { CryptoPay, Assets, PaidButtonNames } = require('@foile/crypto-pay-api');
const cryptoToken = process.env.CRYPTO_PAY_API;

let { languageState } = require('./languages');
const { translate } = require('./languages');
const { generateReferralCode } = require('./userFunctions/refferalCode/referralCodeGenerator');
const { startOptions,
    settingsOptions,
    languageOptions,
    // wallet
    walletOptions,
    topUpOptions,
    topUpCrypto,
    makepaymentTEST,
    // slots
    slotLowBalance,
    gamesOptions,
    slotOptions,
    diceOptions,
    slotGameOption,
    // referral options
    referralOptions,

} = require('./options')(translate);
// db connection
const connectToDb = () => {
    mongoose
        .connect(mongooseUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        .then(() => {
            console.log('Подключено к базе');
        })
        .catch((e) => {
            console.log(e);
        });
};
// LANGUAGE SWITCH
const switchToRu = () => {
    languageState = 'ru';
};
const switchToEn = () => {
    languageState = 'en';
};
connectToDb();
// Crypto Pay Api
// Sweated Pike App
const cryptoPay = new CryptoPay(cryptoToken, {
    hostname: 'testnet-pay.crypt.bot',
    hostname: 'testnet-pay.crypt.bot',
    protocol: 'https'
});
(async function run() {
    const cryptoPay = new CryptoPay(cryptoToken, { hostname: 'testnet-pay.crypt.bot' });

    // Create a new invoice with additional data
    const invoice = await cryptoPay.createInvoice(Assets.BTC, 0.00008, {
        description: 'kitten',
        paid_btn_name: PaidButtonNames.VIEW_ITEM,
        paid_btn_url: 'http://placekitten.com/150',
    });
    // console.log(invoice);
})();


// get ref code function
const refCode = generateReferralCode()
// User Initioalization
let user;
// new User Initialization
let newUser;
// existing user initialization
let existingUser;
// profile initialization
let profile = (a, b) => {
    let profileStatus;
    if (a === 'ru') {
        profileStatus = b.profile.status_ru
    } else if (a === 'en') {
        profileStatus = b.profile.status_en
    };
    return `
${translate[a].profile.name} : ${b.profile.full_name}
${translate[a].profile.balance} : ${b.profile.balance} $
${translate[a].profile.status} : ${profileStatus}
`;
};
// admins array
const admins = ['!@#!@#'];
// /start options (admin, existing user, referral check)
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const chatLanguage = msg.from.language_code;
    const userName = msg.from.username
    // language code
    if (chatLanguage === 'ru') {
        languageState = 'ru'
    } else {
        languageState = 'en'
    };
    // admin check
    if (admins.includes(userName)) {
        console.log("ВЫ АДМИН")
        // admin pannel
    }
    // user is not admin + referral link check
    else {
        console.log("ВЫ ЮЗЕР")
        // is user existing check
        try {
            existingUser = await allUsers.findOne({ _id: chatId });

            if (existingUser) {
                existingUser.user_name = userName;
                await existingUser.save();
                await bot.sendMessage(chatId, profile(languageState, existingUser), startOptions(languageState));
                await console.log('User Is Existing')
            } else {
                newUser = new allUsers({
                    _id: chatId,
                    id: chatId,
                    user_name: userName,
                    profile: {

                        first_name: msg.from.first_name,
                        last_name: msg.from.last_name,
                        full_name: msg.from.first_name + ' ' + msg.from.last_name,
                        status_en: 'Beginner',
                        status_ru: 'Новичок',

                        balance: 0,
                        referral: '',
                    },
                    game_info: {
                        slot_game_played: 0,
                        slot_game_win: 0,
                        slot_game_loss: 0,
                        dice_game_played: 0,
                        dice_game_win: 0,
                        dice_game_loss: 0,

                    },
                    ref_info: {
                        referral_code: '',
                        referral_invited_people: [],
                        referral_invited_people_count: 0,

                        refrral_balance: {
                            balance: 0,
                            balance_withdrawn: 0,
                        },

                        referral_who_invited_id: '',
                        referral_who_invited_referral_code: '',
                    },
                    balance: {
                        withdrawn: 0,
                        spend: 0,
                        balance: 0,
                    },
                });
                await newUser.save();
                await bot.sendMessage(chatId, profile(languageState, newUser), startOptions(languageState));
                await console.log('User Is New')
            }
        } catch (err) {
            console.error(err)
        }
    };
});
// REFERRAL
bot.on("callback_query", async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    user = await allUsers.findOne({ _id: chatId });
    let referralMessage = (a, b) => {
        if (b.ref_info.referral_code === '') {
            return `
${translate[a].referral.no_referral_link}
            `;
        } else {
            return `
${translate[a].referral.ref_link}: ${b.ref_info.referral_code}
            `
        };
    };
    let referralprofileMessage = (a, b) => {
        if (b.ref_info.referral_code === '') {
            return `
${translate[a].referral.no_referral_link}
            `
        } else {
            return `
${translate[a].referral.ref_link}: ${b.ref_info.referral_code}
${translate[a].referral.balance}: ${b.ref_info.refrral_balance.balance}
            `
        };
    };
    // referral option
    if (query.data === 'referral') {
        await bot.editMessageText(referralMessage(languageState, user), {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: referralOptions(languageState).reply_markup,
        });
    }
    // referral back
    else if (query.data === 'referral_back') {
        await bot.editMessageText(profile(languageState, user), {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: startOptions(languageState).reply_markup,
        });
    }
    // referral create
    else if (query.data === 'referral_create') {
        if (user.ref_info.referral_code === '') {
            user.ref_info.referral_code = refCode;
            await user.save();
            await bot.editMessageText(referralMessage(languageState, user), {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: referralOptions(languageState).reply_markup,
            });
        }
        else {
            await bot.editMessageText(`
${translate[languageState].referral.have_referral_link}
${referralMessage(languageState, user)}`, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: referralOptions(languageState).reply_markup,
            });
        };
    }
    // referral profile
    else if (query.data === 'referral_profile') {
        // GET USERS WHO JOINED WITH HIS REFERRAL LINK AND COUNT HIS BALANCE UP TO 10%-30% FROM SUME
    }
});
// WALLET
bot.on("callback_query", async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    user = await allUsers.findOne({ _id: chatId });
    let walletTopUpMessage = (a, b) => {
        return `
${translate[a].wallet.topup_message_currency}
        `
    };

    let walletTopUpCryptoMessage = (a, b) => {
        return `
${translate[a].wallet.topup_message_topup}
        `
    };

    // wallet open
    if (query.data === 'wallet') {
        await bot.editMessageText(profile(languageState, user), {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: walletOptions(languageState).reply_markup,
        });
    }
    // wallet back
    else if (query.data === 'wallet_back') {
        await bot.editMessageText(profile(languageState, user), {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: startOptions(languageState).reply_markup,
        });
    }
    // wallet topup
    else if (query.data === 'topUp') {
        await bot.editMessageText(walletTopUpMessage(languageState), {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: topUpOptions(languageState).reply_markup,
        });
    }
    // topup back
    else if (query.data === 'topUpBack') {
        await bot.editMessageText(profile(languageState, user), {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: walletOptions(languageState).reply_markup,
        });
    }
    // topup crypto
    else if (query.data === 'crypto') {
        console.log('CTYPTO');
    }
    // TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST
    else if (query.data === '+100') {
        user.balance.balance += 100;
        user.profile.balance += 100;
        console.log("+100");
        console.log(query);
        const messageId = query.message.message_id;
        const chatId = query.message.chat.id;
        await user.save();
        await bot.sendMessage(chatId, "Ваш счет пополнен на 100$", {
            reply_to_message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'OK', callback_data: 'OK' }
                    ],
                ]
            },
        });
    }
    else if (query.data === 'OK') {
        const messageId = query.message.message_id;
        const chatId = query.message.chat.id;
        await bot.deleteMessage(chatId, messageId);
    }
});
// GAMES 
bot.on("callback_query", async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const lowBalanceMessage = (languageState, b) => {
        return `
${translate[languageState].wallet.low_balance}
${translate[languageState].profile.balance} : ${b.profile.balance} $
`;
    };
    user = await allUsers.findOne({ _id: chatId });
    if (query.data === 'games') {
        console.log(query
        )

        await bot.editMessageText(profile(languageState, user), {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: gamesOptions(languageState).reply_markup
        })
    }
    if (query.data === 'games_back') {
        console.log(query
        )

        await bot.editMessageText(profile(languageState, user), {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: startOptions(languageState).reply_markup
        })
    }
    else if (query.data === 'slots') {
        console.log(query
        )

        await bot.editMessageText(translate[languageState].games.slots.message, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: slotOptions(languageState).reply_markup
        })
    }
    else if (query.data === 'slots_back') {
        console.log(query
        )

        await bot.editMessageText(profile(languageState, user), {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: gamesOptions(languageState).reply_markup
        })
    }
    else if (query.data === 'slot_game_back') {
        console.log(query
        )

        await bot.editMessageText(translate[languageState].games.slots.message, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: slotOptions(languageState).reply_markup
        })
    }

})
// SLOT GAMES 
let bet = 0.10;
let minBet = 0.10;
let maxBet = 100.00;
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    user = await allUsers.findOne({ _id: chatId });
    slotsGameMessage = (a, b) => {
        return `
${translate[a].games.slots.message}

${translate[a].profile.balance} : ${b.balance.balance} $
    `;
    };
    let betButton = (bet) => { return `${bet} $`;};
    // play
    if (query.data === 'slots_play') {
        if (user.balance.balance < 0.1) {
            await bot.editMessageText(lowBalanceMessage(languageState, user), {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: slotLowBalance(languageState).reply_markup,
            });
        }
        else {
            await bot.editMessageText(slotsGameMessage(languageState, user), {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '-', callback_data: 'slot_game_minus' },
                            { text: betButton(bet), callback_data: 'slot_game_____' },
                            { text: '+', callback_data: 'slot_game_plus' },
                        ],
                        [

                            { text: translate[languageState].games.slots.min, callback_data: 'slit_game_min' },
                            { text: translate[languageState].games.slots.double, callback_data: 'slot_game_double' },
                            { text: translate[languageState].games.slots.max, callback_data: 'slot_game_max' },
                        ],
                        [

                            { text: translate[languageState].games.slots.slot_game_back, callback_data: 'slot_game_back' },
                            { text: translate[languageState].games.slots.slot_game_spin, callback_data: 'slot_game_spin' },
                        ],
                    ],
                },
            });
        };
    }
    // minus button
    else if (query.data === 'slot_game_minus') {
        if (bet < nmiBet || bet == minBet ) {
            bet = minBet;
            console.log("MENSHE")
        } else {
            bet = (parseFloat(bet) - 0.1).toFixed(2);
        };
        await bot.editMessageText(slotsGameMessage(languageState, user), {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '-', callback_data: 'slot_game_minus' },
                        { text: betButton(bet), callback_data: 'slot_game_____' },
                        { text: '+', callback_data: 'slot_game_plus' },
                    ],
                    [

                        { text: translate[languageState].games.slots.min, callback_data: 'slit_game_min' },
                        { text: translate[languageState].games.slots.double, callback_data: 'slot_game_double' },
                        { text: translate[languageState].games.slots.max, callback_data: 'slot_game_max' },
                    ],
                    [

                        { text: translate[languageState].games.slots.slot_game_back, callback_data: 'slot_game_back' },
                        { text: translate[languageState].games.slots.slot_game_spin, callback_data: 'slot_game_spin' },
                    ],
                ],
            },
        });
    }
    // plus button
    else if (query.data === 'slot_game_plus') {
        if (bet > maxBet ) {
            bet = maxBet;
        } else {
            bet = (parseFloat(bet) + 0.1).toFixed(2);
        };
        await bot.editMessageText(slotsGameMessage(languageState, user), {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '-', callback_data: 'slot_game_minus' },
                        { text: betButton(bet), callback_data: 'slot_game_____' },
                        { text: '+', callback_data: 'slot_game_plus' },
                    ],
                    [

                        { text: translate[languageState].games.slots.min, callback_data: 'slit_game_min' },
                        { text: translate[languageState].games.slots.double, callback_data: 'slot_game_double' },
                        { text: translate[languageState].games.slots.max, callback_data: 'slot_game_max' },
                    ],
                    [

                        { text: translate[languageState].games.slots.slot_game_back, callback_data: 'slot_game_back' },
                        { text: translate[languageState].games.slots.slot_game_spin, callback_data: 'slot_game_spin' },
                    ],
                ],
            },
        });
    }
    // double button
    else if (query.data === 'slot_game_double') {
        let newBet = (parseFloat(bet) * 2).toFixed(2);
        if (newBet > maxBet ) {
            bet = maxBet;
        } 
        else {
            bet = (parseFloat(bet) * 2).toFixed(2);
        };
        await bot.editMessageText(slotsGameMessage(languageState, user), {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '-', callback_data: 'slot_game_minus' },
                        { text: betButton(bet), callback_data: 'slot_game_____' },
                        { text: '+', callback_data: 'slot_game_plus' },
                    ],
                    [

                        { text: translate[languageState].games.slots.min, callback_data: 'slit_game_min' },
                        { text: translate[languageState].games.slots.double, callback_data: 'slot_game_double' },
                        { text: translate[languageState].games.slots.max, callback_data: 'slot_game_max' },
                    ],
                    [

                        { text: translate[languageState].games.slots.slot_game_back, callback_data: 'slot_game_back' },
                        { text: translate[languageState].games.slots.slot_game_spin, callback_data: 'slot_game_spin' },
                    ],
                ],
            },
        });
    }
    // minimum button
    else if (query.data === 'slit_game_min') {
        if (bet = minBet) {
            bet = 0.1;
        } else {
            bet = (minBet).toFixed(2);
        };
        await bot.editMessageText(slotsGameMessage(languageState, user), {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '-', callback_data: 'slot_game_minus' },
                        { text: betButton(bet), callback_data: 'slot_game_____' },
                        { text: '+', callback_data: 'slot_game_plus' },
                    ],
                    [

                        { text: translate[languageState].games.slots.min, callback_data: 'slit_game_min' },
                        { text: translate[languageState].games.slots.double, callback_data: 'slot_game_double' },
                        { text: translate[languageState].games.slots.max, callback_data: 'slot_game_max' },
                    ],
                    [

                        { text: translate[languageState].games.slots.slot_game_back, callback_data: 'slot_game_back' },
                        { text: translate[languageState].games.slots.slot_game_spin, callback_data: 'slot_game_spin' },
                    ],
                ],
            },
        });
    }
    // maximum button
    else if (query.data === 'slot_game_max') {
        if ( bet = maxBet ) {
            bet =  maxBet;
        } else {
            bet = (maxBet).toFixed(2);
        }
        
        await bot.editMessageText(slotsGameMessage(languageState, user), {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '-', callback_data: 'slot_game_minus' },
                        { text: betButton(bet), callback_data: 'slot_game_____' },
                        { text: '+', callback_data: 'slot_game_plus' },
                    ],
                    [

                        { text: translate[languageState].games.slots.min, callback_data: 'slit_game_min' },
                        { text: translate[languageState].games.slots.double, callback_data: 'slot_game_double' },
                        { text: translate[languageState].games.slots.max, callback_data: 'slot_game_max' },
                    ],
                    [

                        { text: translate[languageState].games.slots.slot_game_back, callback_data: 'slot_game_back' },
                        { text: translate[languageState].games.slots.slot_game_spin, callback_data: 'slot_game_spin' },
                    ],
                ],
            },
        });
    }
});
// SETTINGS
bot.on('callback_query', async (query) => {
    const chatId = query.from.id;
    const messageId = query.message.message_id;
    let settingsMessage = translate[languageState].settings.options;
    let settingsUser = await allUsers.findOne({ _id: chatId });
    if (query.data === 'settings') {
        await bot.editMessageText(settingsMessage, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: settingsOptions(languageState).reply_markup,
        });
    } else if (query.data === 'settings_back') {
        await bot.editMessageText(profile(languageState, settingsUser), {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: startOptions(languageState).reply_markup,
        });
    } else if (query.data === 'language_selection') {
        await bot.editMessageText(translate[languageState].settings.language_selection, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: languageOptions(languageState).reply_markup,
        });
    } else if (query.data === 'language_back') {
        await bot.editMessageText(translate[languageState].settings.options, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: settingsOptions(languageState).reply_markup,
        });
    } else if (query.data === 'settingsToRu') {
        await switchToRu()
        await bot.editMessageText(translate[languageState].settings.options, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: settingsOptions(languageState).reply_markup,
        });
        console.log(query)
    } else if (query.data === 'settingsToEn') {
        await switchToEn()
        await bot.editMessageText(translate[languageState].settings.options, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: settingsOptions(languageState).reply_markup,
        });
        console.log(query)
    }
});

