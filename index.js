require('dotenv').config();
const cron = require('node-cron');
const Bot = require('node-telegram-bot-api');
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new Bot(token, { polling: true });
// mongodb schemes import
const { allUsers } = require('./userFunctions/mongoRef');
const { promocodes } = require('./adminFunctions/promoRef');
const mongoose = require('mongoose');
const mongooseUrl = process.env.MONGODB_URL;
// Crypto Pay Api
const { CryptoPay, Assets, PaidButtonNames } = require('@foile/crypto-pay-api');
const cryptoToken = process.env.CRYPTO_PAY_API;
// import env telegram link for referral code
const deepLink = process.env.TELEGRAM_DEEP_LINK;
// import language
let { languageState } = require('./languages');
const { translate } = require('./languages');
// import code fucntions action
const { generatePromocode } = require('./adminFunctions/promocodeGenerator/promocodeGenerator.js');
const { generateReferralCode } = require('./userFunctions/refferalCode/referralCodeGenerator');
// import user pannel
const {
    // /start command
    startOptions,
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
    referralBalanceProfile,
} = require('./options/options')(translate);
// import admin pannel
const {
    //  /start command
    adminOptions,
    // promocode option (create)
    promocodeOption,
    // promocode action
    promocodeBase,

    promocodeCustomCreate,
    // delete
    deleteMessage,

} = require('./options/adminOptions');
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

// SETTINGS
// language switch
const switchToRu = () => {
    languageState = 'ru';
};
const switchToEn = () => {
    languageState = 'en';
};

// get ref code function
const refCode = generateReferralCode();
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
${translate[a].profile.name} : ${b.profile.first_name}
${translate[a].profile.balance} : ${b.profile.balance} $
${translate[a].profile.status} : ${profileStatus}
`;
};

// ADMIN
// admin array
const admins = ['!@#!@#'];

// /start options (admin, existing user, referral check)
bot.onText(/\/start/, async (msg, match) => {
    const chatId = msg.chat.id;
    const chatLanguage = msg.from.language_code;
    const userName = msg.from.username;
    const startText = msg.text;

    // language code
    if (chatLanguage === 'ru') {
        languageState = 'ru';
    } else {
        languageState = 'en';
    };

    if (chatId === -1001505524732) {
        await bot.sendMessage(chatId, 'Бот работает нормально');
    } else {
        // admin check
        if (admins.includes(userName)) {
            await bot.sendMessage(chatId, `Вы администратор @${userName}`);
            await bot.sendMessage(chatId, 'Выберите действие', adminOptions)
        }
        // user check + referral link check
        else {
            console.log("ВЫ ЮЗЕР");
            // is user existing check
            try {
                existingUser = await allUsers.findOne({ _id: chatId });
                if (existingUser) {
                    // referralId logic
                    let referralCode = '';
                    if (startText != '/start') {
                        referralCode = startText.substring(7)
                        console.log(process.env.TELEGRAM_DEEP_LINK + referralCode)
                        if (`${process.env.TELEGRAM_DEEP_LINK}${referralCode}` === existingUser.ref_info.referral_code) {
                            await bot.sendMessage(chatId, profile(languageState, existingUser), startOptions(languageState));
                        } else {
                            console.log(`Получен реферальный идентификатор: ${startText}`);
                            const whoIsReferrId = await allUsers.findOne({ "ref_info.referral_code": process.env.TELEGRAM_DEEP_LINK + referralCode });
                            existingUser.referral_who_invited_id = whoIsReferrId._id
                            existingUser.user_name = userName;
                            existingUser.ref_info.referral_who_invited_referral_code = `${process.env.TELEGRAM_DEEP_LINK}${referralCode}`;
                            existingUser.ref_info.referral_who_invited_id = whoIsReferrId.id;
                            existingUser.ref_info.referral_balance_spend_with_one_link = 0;
                            // existingUser.
                            await existingUser.save();
                            await bot.sendMessage(chatId, profile(languageState, existingUser), startOptions(languageState));
                            await console.log('User Is Existing');
                        }

                    } else {
                        referralCode = '';
                        existingUser.user_name = userName;
                        await existingUser.save();
                        await bot.sendMessage(chatId, profile(languageState, existingUser), startOptions(languageState));
                        await console.log('User Is Existing');
                    };

                } else {
                    // referralId logic
                    let whoInvitedCode = '';
                    let whoInvitedId = ''
                    let whoIsReferr = ''
                    if (startText != '/start') {
                        let referralCode = startText.substring(7);
                        whoIsReferr = await allUsers.findOne({ "ref_info.referral_code": process.env.TELEGRAM_DEEP_LINK + referralCode });
                        whoInvitedCode = whoIsReferr.ref_info.referral_code;
                        whoInvitedId = whoIsReferr.id;
                    } else {
                        whoInvitedCode = '';
                        whoInvitedId = '';
                    };
                    console.log(msg)
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
                            referral_balance_spend_with_one_link: 0,
                            referral_invited_people: [],
                            referral_invited_people_count: 0,
                            refrral_balance: {
                                balance: 0,
                                balance_withdrawn: 0,
                            },
                            referral_who_invited_id: whoInvitedId,
                            referral_who_invited_referral_code: whoInvitedCode,
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
    }
});

// USER
// referral
bot.on("callback_query", async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    user = await allUsers.findOne({ _id: chatId });
    let referralMessage = (a, b) => {
        if (b.ref_info.referral_code === '') {
            return `${translate[a].referral.no_referral_link}`;
        } else {
            return `${translate[a].referral.ref_link}: ${b.ref_info.referral_code}`
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
            user.ref_info.referral_code = process.env.TELEGRAM_DEEP_LINK + refCode;
            user.save();
            console.log(user.ref_info.referral_code)
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
        const invitedUsersCount = await allUsers.find({ "ref_info.referral_who_invited_id": chatId })
        const thisUser = await allUsers.findOne({ _id: chatId });
        const count = invitedUsersCount.length;
        const balance = thisUser.ref_info.referral_balance_spend_with_one_link;
        console.log(balance);
        let percentage = 0;
        if(count === 0) {
            percentage = 0;
        } else if (count < 500) {
            percentage = 10;
        } else if (count < 1500) {
            percentage = 20;
        } else if (count >= 1500) {
            percentage = 30;
        }
        const referralprofileMessage = (a, b) => {
            return `
${translate[a].referral.people_in} ${count}
${translate[a].referral.balance} ${balance}
${translate[a].referral.ref_percentage}: ${percentage} %
                    `
            
        }
        bot.editMessageText(referralprofileMessage(languageState, thisUser), {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: referralBalanceProfile(languageState).reply_markup,
        });
    }
    else if (query.data === "referral_balance_profile_withdrawn"){
        
    }
    else if (query.data === "referral_balance_profile_back"){
        await bot.editMessageText(referralMessage(languageState, user), {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: referralOptions(languageState).reply_markup,
        });
    }
});
// wallet
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
// games 
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
// slot games 
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
    let betButton = (bet) => { return `${bet} $`; };
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
        if (bet < nmiBet || bet == minBet) {
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
        if (bet > maxBet) {
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
        if (newBet > maxBet) {
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
        if (bet = maxBet) {
            bet = maxBet;
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
// settings
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

// ADMIN
bot.on('callback_query', async (query) => {
    // promocodes
    const promocodes = "";

    const chatId = query.from.id;
    const messageId = query.message.message_id;
    console.log(query)

    // promocodeLogic
    // promocode create 5 promos

    if (query.data === "admin_promocodes") {
        console.log(query)
        bot.editMessageText("Тут вы можете сгенерировать промокоды которые будут работать 24 часа", {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: promocodeOption.reply_markup,
        });
    }

    else if (query.data === "delete_message") {
        bot.deleteMessage(chatId, messageId);
        console.log("delete");
    }
    // promocode delete message 
    else if (query.data === "admin_promocodes_delete") {
        await bot.deleteMessage(chatId, messageId);
    }
    // promocode get all
    // else if (query.data === "admin_promocodes_get_all") {
    //     await bot.sendMessage(chatId, "Активные прмоокоды");
    // }
    // promocode back action
    else if (query.data === "admin_promocodes_back") {
        bot.editMessageText("Выберите действие", {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: adminOptions.reply_markup,
        });
    }
});
// get 5 promocodes logic
bot.on('callback_query', async (query) => {
    if (query.data === 'admin_promocodes_generate') {
        chatId = query.from.id;
        let promo10 = generatePromocode(10);
        let promo20 = generatePromocode(20);
        let promo30 = generatePromocode(30);
        let promo40 = generatePromocode(40);
        let promo50 = generatePromocode(50);
        let promoToSave = [
            {
                code: promo10, value: 10, status: 'active', date: { creation: new Date(), expire: new Date(Date.now() + 24 * 60 * 60 * 1000), },  used_by: '',
                used_by_id: '',
            },
            {
                code: promo20, value: 20, status: 'active', date: { creation: new Date(), expire: new Date(Date.now() + 24 * 60 * 60 * 1000), },  used_by: '',
                used_by_id: '',
            },
            {
                code: promo30, value: 30, status: 'active', date: { creation: new Date(), expire: new Date(Date.now() + 24 * 60 * 60 * 1000), },  used_by: '',
                used_by_id: '',
            },
            {
                code: promo40, value: 40, status: 'active', date: { creation: new Date(), expire: new Date(Date.now() + 24 * 60 * 60 * 1000), },  used_by: '',
                used_by_id: '',
            },
            {
                code: promo50, value: 50, status: 'active', date: { creation: new Date(), expire: new Date(Date.now() + 24 * 60 * 60 * 1000), },  used_by: '',
                used_by_id: '',
            },
        ]
        for (const promo of promoToSave) {
            const newPromo = new promocodes({
                code: promo.code,
                value: promo.value,
                status: promo.status,
                date: {
                    creation: promo.date.creation,
                    expire: promo.date.expire
                }
            });
            await newPromo.save();
        };
        bot.sendMessage(chatId, "Прмокоды были успешно отправлены в базу данных, для получение полного списка и взаимодействия с ними откройте пункт в меню 'Список промокодов'", deleteMessage);
    };
});
//  custom promocode creation
bot.on('callback_query', async (query) => {
    if (query.data === 'admin_promocodes_generate_custom') {
        chatId = query.from.id;
        messageId = query.message.message_id;
        await bot.sendMessage(chatId, "Отправьте правильное число % который нужно присвоить промокоду", deleteMessage);
        bot.on('message', async (message) => {
            if (message.chat.id === chatId) {
                const input = message.text;
                // Проверка, что введено число
                if (!isNaN(input) && !isNaN(input) > 0) {
                    const value = parseInt(input);
                    const newCustomPromocode = generatePromocode(value);
                    const newCustomPromo = new promocodes({
                        code: newCustomPromocode,
                        value: value,
                        status: "active",
                        date: {
                            creation: new Date(),
                            expire: new Date(Date.now() + 24 * 60 * 60 * 1000),
                        },
                        used_by: '',
                        used_by_id: '',
                    });
                    newCustomPromo.save();
                    await bot.sendMessage(chatId, `Прмокод ${newCustomPromocode} на ${value}% успешно создан и отправлен в базу, для получение полного списка и взаимодействия с ними откройте пункт в меню 'Список промокодов'`, deleteMessage);
                    await bot.deleteMessage(chatId, message.message_id);
                } else {

                    await bot.sendMessage(chatId, "Вы ввели не правильное число", deleteMessage);
                    await bot.deleteMessage(chatId, message.message_id);
                }

                bot.off('message');
            }
        });
    };
});
bot.on('callback_query', async (query) => {
    if (query.data === "admin_promocodes_get_all") {
        chatId = query.from.id;
        console.log(query);
        const allPromocodes = await promocodes.find({});
        console.log(allPromocodes);
        const allPromoMessage = allPromocodes.map(data => data.code + ' \n' + data.status + '\n').join('\n');
        console.log(allPromoMessage);
        bot.sendMessage(chatId, `Все промокоды\nЦифры в конце указывают на % к пополнению:\n${allPromoMessage}`, deleteMessage);
    }

})
// bot.on('callback_query', async (query) => {

// })


cron.schedule('* * * * *', async () => {
    const currentDate = new Date();

    // Найти промокоды, у которых поле `expire` меньше или равно текущей дате
    const expiredPromocodes = await promocodes.find({ "date.expire": { $lte: currentDate } });

    // Обновить статус промокодов на "expired"
    for (const promo of expiredPromocodes) {
        if (promo.status === "active") {
            promo.status = "expired";
            await promo.save();
        }
    }

    console.log(`Обновлено ${expiredPromocodes.length} промокодов`);
});