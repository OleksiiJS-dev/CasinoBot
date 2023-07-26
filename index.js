require('dotenv').config();
const cron = require('node-cron');
const Bot = require('node-telegram-bot-api');
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new Bot(token, { polling: true });
// mongodb schemes import
const { allUsers } = require('./DB/mongoSchema');
const { promocodes } = require('./DB/promoSchema');
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
const { generatePromocode } = require('./Functions/promocodeGenerator.js');
const { generateReferralCode } = require('./Functions/referralCodeGenerator');
const { parseToNum } = require('./Functions/parseToNum');
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

    boneGameOptions,
    boneGameOptionsCreating,
    boneGameOptionThrow,
    diceOptionsGame,
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
const { calculateObjectSize } = require('bson');
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
const createCryptoPayInvoice = new CryptoPay(cryptoToken, {
    hostname: 'testnet-pay.crypt.bot',
    // production
    // hostname: 'testnet-pay.crypt.bot',
    protocol: 'https'
});
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
const profile =  (a, b) => {
    let profileStatus;
    if (b.balance.m_spend > 15 && b.balance.m_spend <= 250) {
        b.profile.status_ru = translate[a].profile.status_lvl[1]
        b.profile.status_en = translate[a].profile.status_lvl[1]
    }
    if (b.balance.m_spend > 250 && b.balance.m_spend <= 1000) {
        b.profile.status_ru = translate[a].profile.status_lvl[2]
        b.profile.status_en = translate[a].profile.status_lvl[2]
    }
    else if (b.balance.m_spend > 1000 && b.balance.m_spend <= 5000) {
        b.profile.status_ru = translate[a].profile.status_lvl[3]
        b.profile.status_en = translate[a].profile.status_lvl[3]
    }
    else if (b.balance.m_spend > 5000 && b.balance.m_spend <= 15000) {
        b.profile.status_ru = translate[a].profile.status_lvl[4]
        b.profile.status_en = translate[a].profile.status_lvl[4]
    }
    else if (b.balance.m_spend > 15000) {
        b.profile.status_ru = translate[a].profile.status_lvl[5]
        b.profile.status_en = translate[a].profile.status_lvl[5]
    }
    else {
        b.profile.status_ru = translate[a].profile.status_lvl[0]
        b.profile.status_en = translate[a].profile.status_lvl[0]
    }
     b.save()
    if (a === 'ru') {
        profileStatus = b.profile.status_ru
    } else {
        profileStatus = b.profile.status_en
    };
    return `
${translate[a].profile.name} : ${b.profile.first_name}
${translate[a].profile.balance} : ${b.profile.balance} $
${translate[a].profile.status} : ${profileStatus}
`;
};

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
            await bot.sendMessage(chatId, 'Выберите действие', adminOptions);
        }
        // user check + referral link check
        else {
            // is user existing check
            try {
                existingUser = await allUsers.findOne({ _id: chatId });
                if (existingUser) {
                    // referralId logic
                    let referralCode = '';
                    if (startText != '/start') {
                        referralCode = startText.substring(7);
                        if (`${process.env.TELEGRAM_DEEP_LINK}${referralCode}` === existingUser.referral_info.referral_code) {
                            await bot.sendMessage(chatId, profile(languageState, existingUser), startOptions(languageState));
                        } else {
                            const whoIsReferrId = await allUsers.findOne({ "referral_info.referral_code": process.env.TELEGRAM_DEEP_LINK + referralCode });
                            existingUser.referral_who_invited_id = whoIsReferrId._id;
                            existingUser.user_name = userName;
                            existingUser.referral_info.referral_who_invited_referral_code = `${process.env.TELEGRAM_DEEP_LINK}${referralCode}`;
                            existingUser.referral_info.referral_who_invited_id = whoIsReferrId.id;
                            existingUser.referral_info.referral_balance_spend_with_one_link = 0;
                            // existingUser.
                            await existingUser.save();
                            await bot.sendMessage(chatId, profile(languageState, existingUser), startOptions(languageState));
                        };
                    } else {
                        referralCode = '';
                        await bot.sendMessage(chatId, profile(languageState, existingUser), startOptions(languageState));
                    };
                } else {
                    // referralId logic
                    let whoInvitedCode = '';
                    let whoInvitedId = '';
                    let whoIsReferr = '';
                    if (startText != '/start') {
                        let referralCode = startText.substring(7);
                        whoIsReferr = await allUsers.findOne({ "referral_info.referral_code": process.env.TELEGRAM_DEEP_LINK + referralCode });
                        whoInvitedCode = whoIsReferr.referral_info.referral_code;
                        whoInvitedId = whoIsReferr.id;
                    } else {
                        whoInvitedCode = '';
                        whoInvitedId = '';
                    };
                    newUser = new allUsers({
                        _id: chatId,
                        id: chatId,
                        user_name: userName,
                        promo: 0,
                        pay_url: '',
                        profile: {
                            first_name: msg.from.first_name,
                            last_name: msg.from.last_name,
                            full_name: msg.from.first_name + ' ' + msg.from.last_name,
                            status_en: 'Beginner',
                            status_ru: 'Новичок',
                            balance: 12003,
                        },
                        game_info: {
                            slot_bet: 1,
                            slot_game_played: 0,
                            slot_game_win: 0,
                            slot_game_loss: 0,

                            dice_bet: 1,
                            dice_game_position: [],
                            dice_game_played: 0,
                            dice_game_win: 0,
                            dice_game_loss: 0,

                            bone_bet_played: 0,
                            bone_bet_win: 0,
                            bone_bet_loss: 0,
                            bone_bet_loss: 0,

                            bone_game: {
                                room_id: '',
                                opponent_id: '',
                                game_bet: 1,
                                game_status: '',

                                owner_throw: 0,
                                opponent_throw: 0,

                            }
                        },
                        referral_info: {
                            referral_code: '',
                            referral_balance_spend_with_one_link: 0,
                            referral_balance: {
                                balance_earned: 0,
                                balance_withdrawn: 0,
                            },
                            referral_who_invited_id: whoInvitedId,
                            referral_who_invited_referral_code: whoInvitedCode,
                        },
                        balance: {
                            withdrawn: 0,
                            spend: 0,
                            m_spend: 0,
                        },
                    });
                    await newUser.save();
                    await bot.sendMessage(chatId, profile(languageState, newUser), startOptions(languageState));
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
        if (b.referral_info.referral_code === '') {
            return `${translate[a].referral.no_referral_link}`;
        } else {
            return `${translate[a].referral.ref_link}: ${b.referral_info.referral_code}`;
        };
    };
    let referralprofileMessage = (a, b) => {
        if (b.referral_info.referral_code === '') {
            return `
    ${translate[a].referral.no_referral_link}
                `;
        } else {
            return `
    ${translate[a].referral.ref_link}: ${b.referral_info.referral_code}
                `;
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
        if (user.referral_info.referral_code === '') {
            user.referral_info.referral_code = process.env.TELEGRAM_DEEP_LINK + refCode;
            user.save();
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
        const invitedUsersCount = await allUsers.find({ "referral_info.referral_who_invited_id": chatId })
        const thisUser = await allUsers.findOne({ _id: chatId });
        const count = invitedUsersCount.length;

        let balance = thisUser.referral_info.referral_balance.balance_earned;

        // thisUser.save()

        let percentage = 0;
        if (count === 0) {
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
// ${translate[a].referral.balance} ${balance}
${translate[a].referral.ref_percentage}: ${percentage} %
                    `;
        };
        bot.editMessageText(referralprofileMessage(languageState, thisUser), {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: referralBalanceProfile(languageState).reply_markup,
        });
    }
    else if (query.data === "referral_balance_profile_withdrawn") {
    }
    else if (query.data === "referral_balance_profile_back") {
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
            `;
    };
    let walletTopUpCryptoMessage = (a, b) => {
        return `
    ${translate[a].wallet.topup_message_topup}
            `;
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
        const chatId = query.message.chat.id;
        const messageId = query.message.message_id;
        let user = await allUsers.findOne({ _id: chatId });
        let promoBonus = 0;
        if (user.promo === 0) {
            promoBonus = 0;
        } else {
            promoBonus = user.promo;
        }

        const currencies = ["USDT", "TON", "BTC", "ETH", "BNB", "BUSD", "TRX", "USDC"];

        const buttons = currencies.map(currency => ({
            text: `${currency}`,
            callback_data: currency,
        }));

        const options = {
            reply_markup: {
                inline_keyboard: buttons.map(button => [button]),
            },
        };

        await bot.editMessageText(translate[languageState].wallet.topup_message_crypto, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: options.reply_markup,
        });
    }
    else if (["USDT", "TON", "BTC", "ETH", "BNB", "BUSD", "TRX", "USDC"].includes(query.data)) {
        const chatId = query.message.chat.id;
        const messageId = query.message.message_id;
        const currencyCode = query.data


        await bot.editMessageText(translate[languageState].wallet.topup_message_topup, {
            chat_id: chatId,
            message_id: messageId,
        })

        bot.on("message", async (msg) => {
            const chatId = msg.chat.id;
            const text = msg.text;
            const messageId = msg.message_id;

            if (!isNaN(text)) {
                const invoice = await createCryptoPayInvoice.createInvoice(currencyCode, parseFloat(text), {});

                user.pay_url = invoice.pay_url
                user.save()

                bot.sendMessage(chatId, invoice.pay_url);
                bot.sendMessage(chatId, invoice.invoice_id);
                console.log(invoice)


                bot.sendMessage(chatId, 'Crypto Pay Check', {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Check', callback_data: 'invoicepaid' }],
                        ],
                    }
                });
            } else {
                await bot.sendMessage(chatId, profile(languageState, user), startOptions(languageState));
            }
        });

    }
    else if (query.data === 'invoicepaid') {
        const messageId = query.message.message_id
        const chatId = query.from.id

        const invoices = await createCryptoPayInvoice.getInvoices({ pay_url: user.pay_url });

        console.log(query)

        switch (invoices.items[0].status) {
            case 'paid':

                bot.deleteMessage(chatId, messageId);

                const promoPerc = user.promo;

                const percent = promoPerc / 100;
                const count = parseFloat(invoices.items[0].amount)

                user.profile.balance = user.profile.balance + count;
                user.profile.balance = user.profile.balance + count * percent;
                user.promo = 0;
                user.pay_url = '';
                try {
                    await bot.sendMessage(chatId, 'Thank You', walletOptions(languageState));
                } catch (error) {
                    // Handle the error if needed
                } finally {
                    // This block will be executed regardless of whether there was an error or not
                    user.save();
                }

                break;
            default:
                bot.deleteMessage(chatId, messageId);
                bot.sendMessage(chatId, 'Crypto Pay Error', {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Check', callback_data: 'invoicepaid' }],

                        ],
                    }
                });
        }
    }
    else if (query.data === '+100') {
        user.balance.balance += 100;
        user.profile.balance += 100;
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
    // fiat add "later"
    else if (query.data === 'fiat') {
        await bot.sendMessage(chatId, translate[languageState].wallet.fiat_later, deleteMessage);
    }
    // promocode activation
    else if (query.data === 'promocode') {
        await bot.sendMessage(chatId, translate[languageState].wallet.promocode_activate, deleteMessage);
        bot.on('message', async (message) => {
            const input = message.text;

            const user = await allUsers.findOne({ _id: chatId });

            if (user.promo != 0) {
                bot.sendMessage(chatId, translate[languageState].wallet.promoused, deleteMessage);
                await bot.deleteMessage(chatId, message.message_id);
            } else {
                if (message.chat.id === chatId) {
                    // promo
                    const existingPromocode = await promocodes.findOne({ code: input });
                    const promocodePercent = existingPromocode.value;
                    // user
                    const user = await allUsers.findOne({ _id: chatId })
                    if (existingPromocode
                        && existingPromocode.status === "active"
                    ) {
                        // promo
                        existingPromocode.status = 'used';
                        existingPromocode.used_by = chatId;
                        existingPromocode.used_by_id = chatId;
                        existingPromocode.save();
                        // user
                        user.promo = promocodePercent;
                        user.save();

                        await bot.sendMessage(chatId, `${translate[languageState].wallet.promocode_activated} ${existingPromocode.code} ${promocodePercent}%`, deleteMessage);
                        await bot.deleteMessage(chatId, message.message_id);
                        await bot.deleteMessage(chatId, message.message_id - 1);
                    } else {
                        await bot.sendMessage(chatId, translate[languageState].wallet.promocode_not_activated, deleteMessage);
                        await bot.deleteMessage(chatId, message.message_id);
                        await bot.deleteMessage(chatId, message.message_id - 1);
                    }
                    bot.off('message');
                }
            }

        });
    }
    // else if (query.data === 'withdrawl') {
    //     const messageId = query.message.message_id;
    //     const chatId = query.message.chat.id;
    //     bot.sendMessage(chatId, 'Введите сообщение для заявки на пополнение, сумму и комментарий')
    //     let message;
    //     bot.on("message", async (msg) => {
    //         const chatId = msg.chat.id;
    //         const text = msg.text;


    //     });

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

        await bot.editMessageText(profile(languageState, user), {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: gamesOptions(languageState).reply_markup
        })
    }
    else if (query.data === 'games_back') {

        await bot.editMessageText(profile(languageState, user), {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: startOptions(languageState).reply_markup
        })
    }
    else if (query.data === 'slots') {

        await bot.editMessageText(translate[languageState].games.slots.message, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: slotOptions(languageState).reply_markup
        })
    }
    else if (query.data === 'slots_back') {

        await bot.editMessageText(profile(languageState, user), {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: gamesOptions(languageState).reply_markup
        })
    }
    else if (query.data === 'slot_game_back') {

        await bot.editMessageText(translate[languageState].games.slots.message, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: slotOptions(languageState).reply_markup
        })
    }

});
// slot games 
let minBet = 0.10;
let maxBet = 100.00;
let newBet;
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    user = await allUsers.findOne({ _id: chatId });
    slotsGameMessage = (a, b, c) => {
        return `
${translate[a].games.slots.message}

${translate[a].profile.balance} : ${b.profile.balance} $

${translate[a].games.slots.bet} : ${c} $
        `;
    };
    slotsGameMessageBetIsTooBig = (a, b) => {
        return `
${translate[a].games.slots.bet_is_too_big}
        `;
    };
    slotsGameMessageBetIsTooSmall = (a, b) => {
        return `
${translate[a].games.slots.bet_is_too_small}
        `;
    };
    lowBalanceMessage = (a, b) => {
        return `
${translate[a].wallet.low_balance}
        `;
    };
    let betButton = (bet) => {
        if (typeof bet === 'number') {
            return `${bet.toFixed(2)} $`;
        } else {
            bet = parseFloat(bet)
            bet = bet.toFixed(2)
            return bet;
        }
    };

    newBet = user.game_info.slot_bet;
    newBet = parseInt(newBet)

    // play
    if (query.data === 'slots_play') {
        if (user.profile.balance < 0.1) {
            await bot.editMessageText(lowBalanceMessage(languageState, user), {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: slotLowBalance(languageState).reply_markup,
            });
        }
        else {
            await bot.editMessageText(slotsGameMessage(languageState, user, user.game_info.slot_bet), {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '-', callback_data: 'slot_game_minus' },
                            { text: betButton(user.game_info.slot_bet), callback_data: 'slot_game_____' },
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
        switch (user.game_info.slot_bet) {
            case slot_bet = 0.1:
                await bot.editMessageText(slotsGameMessageBetIsTooSmall(languageState), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '-', callback_data: 'foobar' },
                                { text: betButton(user.game_info.slot_bet), callback_data: 'slot_game_____' },
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
                break;
            default:
                newBet = user.game_info.slot_bet
                newBet = newBet - 0.1
                newBet = parseFloat(newBet)
                newBet = newBet.toFixed(2)
                user.game_info.slot_bet = parseFloat(newBet)
                user.save()
                await bot.editMessageText(slotsGameMessage(languageState, user, user.game_info.slot_bet), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '-', callback_data: 'slot_game_minus' },
                                { text: betButton(user.game_info.slot_bet), callback_data: 'slot_game_____' },
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
                break;
        };
    }
    // plus button
    else if (query.data === 'slot_game_plus') {
        switch (user.game_info.slot_bet) {
            case slot_bet = 100:
                // slotsGameMessageBetIsTooBig(languageState)
                await bot.editMessageText(slotsGameMessage(languageState, user, user.game_info.slot_bet), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '-', callback_data: 'slot_game_minus' },
                                { text: betButton(user.game_info.slot_bet), callback_data: 'slot_game_____' },
                                { text: '+', callback_data: 'foobar' },
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
                break;
            default:
                newBet = user.game_info.slot_bet
                newBet = newBet + 0.1
                newBet = parseFloat(newBet)
                newBet = newBet.toFixed(2)
                user.game_info.slot_bet = parseFloat(newBet)
                user.save()
                await bot.editMessageText(slotsGameMessage(languageState, user, user.game_info.slot_bet), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '-', callback_data: 'slot_game_minus' },
                                { text: betButton(user.game_info.slot_bet), callback_data: 'slot_game_____' },
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
                break;
        };
    }
    // double button
    else if (query.data === 'slot_game_double') {
        if (user.game_info.slot_bet > 50) {
            await bot.editMessageText(slotsGameMessage(languageState, user, user.game_info.slot_bet), {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '-', callback_data: 'slot_game_minus' },
                            { text: betButton(user.game_info.slot_bet), callback_data: 'slot_game_____' },
                            { text: '+', callback_data: 'slot_game_plus' },
                        ],
                        [

                            { text: translate[languageState].games.slots.min, callback_data: 'slit_game_min' },
                            { text: translate[languageState].games.slots.double, callback_data: 'foobar' },
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
        else {
            newBet = user.game_info.slot_bet
            newBet = newBet * 2
            newBet = parseFloat(newBet)
            newBet = newBet.toFixed(2)
            user.game_info.slot_bet = parseFloat(newBet)
            user.save()
            await bot.editMessageText(slotsGameMessage(languageState, user, user.game_info.slot_bet), {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '-', callback_data: 'slot_game_minus' },
                            { text: betButton(user.game_info.slot_bet), callback_data: 'slot_game_____' },
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
    }
    // slot game min game
    else if (query.data === 'slit_game_min') {
        switch (user.game_info.slot_bet) {
            case 0.1:
                await bot.editMessageText(slotsGameMessage(languageState, user, user.game_info.slot_bet), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '-', callback_data: 'foobar' },
                                { text: betButton(user.game_info.slot_bet), callback_data: 'slot_game_____' },
                                { text: '+', callback_data: 'slot_game_plus' },
                            ],
                            [

                                { text: translate[languageState].games.slots.min, callback_data: 'foobar' },
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
                break;
            default:
                newBet = user.game_info.slot_bet
                newBet = 0.1
                newBet = parseFloat(newBet)
                newBet = newBet.toFixed(2)
                user.game_info.slot_bet = parseFloat(newBet)
                user.save()
                await bot.editMessageText(slotsGameMessage(languageState, user, user.game_info.slot_bet), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '-', callback_data: 'slot_game_minus' },
                                { text: betButton(user.game_info.slot_bet), callback_data: 'slot_game_____' },
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
                break;
        };
    }
    // slot game max butt
    else if (query.data === 'slot_game_max') {
        switch (user.game_info.slot_bet) {
            case 100:
                await bot.editMessageText(slotsGameMessage(languageState, user, user.game_info.slot_bet), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '-', callback_data: 'slot_game_minus' },
                                { text: betButton(user.game_info.slot_bet), callback_data: 'slot_game_____' },
                                { text: '+', callback_data: 'slot_game_plus' },
                            ],
                            [

                                { text: translate[languageState].games.slots.min, callback_data: 'slit_game_min' },
                                { text: translate[languageState].games.slots.double, callback_data: 'slot_game_double' },
                                { text: translate[languageState].games.slots.max, callback_data: 'foobar' },
                            ],
                            [

                                { text: translate[languageState].games.slots.slot_game_back, callback_data: 'slot_game_back' },
                                { text: translate[languageState].games.slots.slot_game_spin, callback_data: 'slot_game_spin' },
                            ],
                        ],
                    },
                });
                break;
            default:
                newBet = user.game_info.slot_bet
                newBet = 100
                newBet = parseFloat(newBet)
                newBet = newBet.toFixed(2)
                user.game_info.slot_bet = parseFloat(newBet)
                user.save()
                await bot.editMessageText(slotsGameMessage(languageState, user, user.game_info.slot_bet), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '-', callback_data: 'slot_game_minus' },
                                { text: betButton(user.game_info.slot_bet), callback_data: 'slot_game_____' },
                                { text: '+', callback_data: 'slot_game_plus' },
                            ],
                            [

                                { text: translate[languageState].games.slots.min, callback_data: 'slit_game_min' },
                                { text: translate[languageState].games.slots.double, callback_data: 'slot_game_double' },
                                { text: translate[languageState].games.slots.max, callback_data: 'foobar' },
                            ],
                            [

                                { text: translate[languageState].games.slots.slot_game_back, callback_data: 'slot_game_back' },
                                { text: translate[languageState].games.slots.slot_game_spin, callback_data: 'slot_game_spin' },
                            ],
                        ],
                    },
                });
                break;
        };
    }
    // foobar
    else if (query.data === 'foobar') {
        console.log('foobar')
    }

    // spin
    else if (query.data === 'slot_game_spin') {
        if (user.game_info.slot_bet > user.profile.balance) {
            bot.sendMessage(chatId, '[**No balance]', deleteMessage);
        }
        else {
            let user = await allUsers.findOne({ _id: chatId });
            let referralUser = await allUsers.findOne({ _id: user.referral_info.referral_who_invited_id })
            // win bet
            // console.log(referralUser)
            console.log(user)
            let winBet
            // emoji
            const emoji = `🎰`
            //
            const x3Win = [64]
            const x2Win = [1, 22, 43]
            const p20Win = [2, 3, 4, 5, 6, 9, 11, 16, 17, 18, 21, 23, 24, 26, 27, 32, 33, 35, 38, 41, 42, 43, 44, 48, 49, 54, 56, 59, 60, 61, 62, 63]
            const p10Win = [0, 7, 8, 10, 12, 13, 14, 15, 19, 20, 25, 28, 29, 30, 31, 34, 36, 37, 39, 40, 45, 46, 47, 50, 51, 52, 53, 55, 57, 58];

            bot.editMessageText('...', {
                chat_id: chatId,
                message_id: messageId,
            });

            await bot.sendDice(chatId, { emoji })
                .then(async (response) => {
                    console.log(response)
                    let diceValue = response.dice.value;
                    if (x3Win.includes(diceValue)) {

                        winBet = user.game_info.slot_bet * 3

                        console.log(winBet)
                        winBet = parseToNum(winBet)

                        user.profile.balance = user.profile.balance - user.game_info.slot_bet
                        user.profile.balance = user.profile.balance + winBet
                        user.profile.balance = parseToNum(user.profile.balance)

                        user.balance.m_spend = user.balance.m_spend + user.game_info.slot_bet
                        user.balance.m_spend = parseToNum(user.balance.m_spend)

                        user.game_info.slot_game_win = user.game_info.slot_game_win + winBet
                        user.game_info.slot_game_win = parseToNum(user.game_info.slot_game_win)
                        user.game_info.slot_game_loss = user.game_info.slot_game_loss + user.game_info.slot_bet
                        user.game_info.slot_game_loss = parseToNum(user.game_info.slot_game_loss)

                        if (user.referral_info.referral_who_invited_id != '') {
                            referralUser.referral_info.referral_balance.balance_earned = referralUser.referral_info.referral_balance.balance_earned + user.game_info.slot_bet
                            referralUser.referral_info.referral_balance.balance_earned = parseToNum(referralUser.referral_info.referral_balance.balance_earned)
                            referralUser.save()
                        }

                        user.balance.spend = user.balance.spend + user.game_info.slot_bet
                        user.balance.spend = parseFloat(user.balance.spend)
                        user.game_info.slot_game_played += 1
                        user.save()


                        await bot.editMessageText(`Ваш выигрыш ${winBet}$ \nВы виграли х3 от ставки`, {
                            chat_id: chatId,
                            message_id: messageId,
                        });
                    }
                    else if (x2Win.includes(diceValue)) {

                        winBet = user.game_info.slot_bet * 2

                        console.log(winBet)
                        winBet = parseToNum(winBet)

                        user.profile.balance = user.profile.balance - user.game_info.slot_bet
                        user.profile.balance = user.profile.balance + winBet
                        user.profile.balance = parseToNum(user.profile.balance)

                        user.balance.m_spend = user.balance.m_spend + user.game_info.slot_bet
                        user.balance.m_spend = parseToNum(user.balance.m_spend)

                        user.game_info.slot_game_win = user.game_info.slot_game_win + winBet
                        user.game_info.slot_game_win = parseToNum(user.game_info.slot_game_win)
                        user.game_info.slot_game_loss = user.game_info.slot_game_loss + user.game_info.slot_bet
                        user.game_info.slot_game_loss = parseToNum(user.game_info.slot_game_loss)

                        if (user.referral_info.referral_who_invited_id != '') {
                            referralUser.referral_info.referral_balance.balance_earned = referralUser.referral_info.referral_balance.balance_earned + user.game_info.slot_bet
                            referralUser.referral_info.referral_balance.balance_earned = parseToNum(referralUser.referral_info.referral_balance.balance_earned)
                            referralUser.save()
                        }


                        user.balance.spend = user.balance.spend + user.game_info.slot_bet
                        user.balance.spend = parseInt(user.balance.spend)
                        user.game_info.slot_game_played += 1
                        user.save()

                        console.log(winBet, user.game_info.slot_bet)
                        await bot.editMessageText(`Ваш выигрыш ${winBet}$ \nВы виграли х2 от ставки`, {
                            chat_id: chatId,
                            message_id: messageId,
                        });
                    }
                    else if (p20Win.includes(diceValue)) {


                        winBet = user.game_info.slot_bet * 0.2

                        console.log(winBet)
                        winBet = parseToNum(winBet)

                        user.profile.balance = user.profile.balance - user.game_info.slot_bet
                        user.profile.balance = user.profile.balance + winBet
                        user.profile.balance = parseToNum(user.profile.balance)

                        user.balance.m_spend = user.balance.m_spend + user.game_info.slot_bet
                        user.balance.m_spend = parseToNum(user.balance.m_spend)

                        user.game_info.slot_game_win = user.game_info.slot_game_win + winBet
                        user.game_info.slot_game_win = parseToNum(user.game_info.slot_game_win)
                        user.game_info.slot_game_loss = user.game_info.slot_game_loss + user.game_info.slot_bet
                        user.game_info.slot_game_loss = parseToNum(user.game_info.slot_game_loss)

                        if (user.referral_info.referral_who_invited_id != '') {
                            referralUser.referral_info.referral_balance.balance_earned = referralUser.referral_info.referral_balance.balance_earned + user.game_info.slot_bet
                            referralUser.referral_info.referral_balance.balance_earned = parseToNum(referralUser.referral_info.referral_balance.balance_earned)
                            referralUser.save()
                        }

                        user.balance.spend = user.balance.spend + user.game_info.slot_bet
                        user.balance.spend = parseInt(user.balance.spend)
                        user.game_info.slot_game_played += 1
                        user.save()

                        console.log(winBet, user.game_info.slot_bet)
                        await bot.editMessageText(`Ваш выигрыш ${winBet}$ \nВы виграли 20% от ставки`, {
                            chat_id: chatId,
                            message_id: messageId,
                        });
                    }
                    else if (p10Win.includes(diceValue)) {
                        winBet = user.game_info.slot_bet * 0.1
                        console.log(winBet)
                        winBet = parseToNum(winBet)

                        user.profile.balance = user.profile.balance - user.game_info.slot_bet
                        user.profile.balance = user.profile.balance + winBet
                        user.profile.balance = parseToNum(user.profile.balance)

                        user.balance.m_spend = user.balance.m_spend + user.game_info.slot_bet
                        user.balance.m_spend = parseToNum(user.balance.m_spend)

                        user.game_info.slot_game_win = user.game_info.slot_game_win + winBet
                        user.game_info.slot_game_win = parseToNum(user.game_info.slot_game_win)
                        user.game_info.slot_game_loss = user.game_info.slot_game_loss + user.game_info.slot_bet
                        user.game_info.slot_game_loss = parseToNum(user.game_info.slot_game_loss)

                        if (user.referral_info.referral_who_invited_id != '') {
                            referralUser.referral_info.referral_balance.balance_earned = referralUser.referral_info.referral_balance.balance_earned + user.game_info.slot_bet
                            referralUser.referral_info.referral_balance.balance_earned = parseToNum(referralUser.referral_info.referral_balance.balance_earned)
                            referralUser.save()
                        }

                        user.balance.spend = user.balance.spend + user.game_info.slot_bet
                        user.balance.spend = parseInt(user.balance.spend)
                        user.game_info.slot_game_played += 1
                        user.save()

                        console.log(winBet, user.game_info.slot_bet)
                        await bot.editMessageText(`Ваш выигрыш ${winBet}$ \nВы Выиграли 10% от ставки`, {
                            chat_id: chatId,
                            message_id: messageId,
                        });

                    }
                })
                .catch((error) => {
                    console.error('Ошибка при отправке анимированного эмодзи:', error);
                })
                .finally(async () => {
                    await bot.sendMessage(chatId, slotsGameMessage(languageState, user, user.game_info.slot_bet), {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: '-', callback_data: 'slot_game_minus' },
                                    { text: betButton(user.game_info.slot_bet), callback_data: 'slot_game_____' },
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
                        }

                    })
                })

        }
    }
});
let minBetDice = 0.10;
let maxBetDice = 100.00;
let newBetDice;
// dice game
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    user = await allUsers.findOne({ _id: chatId });

    const diceGameMessage = (a, b, c) => {
        return `
${translate[a].games.dice.message}
${translate[a].profile.balance}: ${user.profile.balance} $`;
    };
    const diceBetMessage = (a, b, c) => {
        return `
${translate[a].games.dice.message} 

${b.game_info.dice_bet} $
        `;
    };
    let betButton = (bet) => {
        if (typeof bet === 'number') {
            return `${bet.toFixed(2)} $`;
        } else {
            bet = parseFloat(bet);
            bet = bet.toFixed(2);
            return bet;
        }
    };
    const boneGameAbout = (languageState) => {
        return translate[languageState].games.dice.versus.game;
    };
    // user.game_info.dice_bet
    // positions
    const position1 = [1];
    const position2 = [2];
    const position3 = [3];
    const position4 = [4];
    const position5 = [5];
    const position6 = [6];
    const position12 = [1, 2];
    const position34 = [3, 4];
    const position56 = [5, 6];
    const positionOdd = [1, 3, 5];
    const positionEven = [2, 4, 6];

    // new dice bet
    let newDiceBet;
    const bone_game = user.game_info.bone_game;
    // let user.game_info.bone_game.game_bet = bone_game.game_bet
    let newBetVersus;

    const setBetMessage = (a) => {
        return `${translate[a].games.dice.versus.place_a_bet}`
    };

    const allGames = await allUsers.find({ 'game_info.bone_game.game_status': 'created' });
    const allGamesConnected = await allUsers.find({ 'game_info.bone_game.game_status': 'connected' });
    // const gamesArrayForQuery = allGames.game_info.bone_game.room_id
    const gamesArrayForQuery = allGames.map((items) => items.game_info.bone_game.room_id);

    if (query.data === 'dice') {
        await bot.editMessageText(translate[languageState].games.dice.message, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: diceOptions(languageState).reply_markup,
        });
    }
    else if (query.data === 'dice_back') {
        await bot.editMessageText(profile(languageState, user), {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: gamesOptions(languageState).reply_markup,
        });
    }
    else if (query.data === 'dice_game_back') {
        user.game_info.dice_game_position = [];
        user.save()
        await bot.editMessageText(translate[languageState].games.dice.message, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: diceOptions(languageState).reply_markup,
        })
    }
    else if (query.data === "dice_nd") {
        await bot.editMessageText(diceGameMessage(languageState), {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: `${translate[languageState].games.dice.bet}: ${user.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },
                    ],
                    [
                        { text: 1, callback_data: 'dice_game_bet_on_1' },
                        { text: 2, callback_data: 'dice_game_bet_on_2' },
                        { text: 3, callback_data: 'dice_game_bet_on_3' },
                        { text: 4, callback_data: 'dice_game_bet_on_4' },
                        { text: 5, callback_data: 'dice_game_bet_on_5' },
                        { text: 6, callback_data: 'dice_game_bet_on_6' },
                    ],
                    [
                        { text: '1-2', callback_data: 'dice_game_bet_on_1_2' },
                        { text: '3-4', callback_data: 'dice_game_bet_on_3_4' },
                        { text: '5-6', callback_data: 'dice_game_bet_on_5_6' },
                    ],
                    [
                        { text: translate[languageState].games.dice.odd, callback_data: 'dice_game_bet_on_odd' },
                        { text: translate[languageState].games.dice.even, callback_data: 'dice_game_bet_on_even' },
                    ],
                    [
                        { text: translate[languageState].games.dice.back, callback_data: 'dice_game_back' },
                        { text: translate[languageState].games.dice.throw, callback_data: 'dice_game_play' },
                    ],
                ]
            },
        });
    }
    else if (query.data === 'dice_game_bet_on_1') {
        switch (user.game_info.dice_bet) {
            case position1:
                await bot.editMessageText(diceGameMessage(languageState), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: `${translate[languageState].games.dice.bet}: ${user.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },
                            ],
                            [
                                { text: '1 ✅', callback_data: 'foobar' },
                                { text: '2', callback_data: 'dice_game_bet_on_2' },
                                { text: '3', callback_data: 'dice_game_bet_on_3' },
                                { text: '4', callback_data: 'dice_game_bet_on_4' },
                                { text: '5', callback_data: 'dice_game_bet_on_5' },
                                { text: '6', callback_data: 'dice_game_bet_on_6' },
                            ],
                            [
                                { text: '1-2', callback_data: 'dice_game_bet_on_1_2' },
                                { text: '3-4', callback_data: 'dice_game_bet_on_3_4' },
                                { text: '5-6', callback_data: 'dice_game_bet_on_5_6' },
                            ],
                            [
                                { text: `${translate[languageState].games.dice.odd}`, callback_data: 'dice_game_bet_on_odd' },
                                { text: `${translate[languageState].games.dice.even}`, callback_data: 'dice_game_bet_on_even' },
                            ],
                            [
                                { text: translate[languageState].games.dice.back, callback_data: 'dice_game_back' },
                                { text: translate[languageState].games.dice.throw, callback_data: 'dice_game_play' },
                            ],
                        ]
                    },
                });
                break;
            default:
                user.game_info.dice_game_position = position1;
                user.save();
                await bot.editMessageText(diceGameMessage(languageState), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `${translate[languageState].games.dice.bet}: ${user.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },],
                            [
                                { text: '1 ✅', callback_data: 'foobar' },
                                { text: '2', callback_data: 'dice_game_bet_on_2' },
                                { text: '3', callback_data: 'dice_game_bet_on_3' },
                                { text: '4', callback_data: 'dice_game_bet_on_4' },
                                { text: '5', callback_data: 'dice_game_bet_on_5' },
                                { text: '6', callback_data: 'dice_game_bet_on_6' },
                            ],
                            [
                                { text: '1-2', callback_data: 'dice_game_bet_on_1_2' },
                                { text: '3-4', callback_data: 'dice_game_bet_on_3_4' },
                                { text: '5-6', callback_data: 'dice_game_bet_on_5_6' },
                            ],
                            [
                                { text: `${translate[languageState].games.dice.odd}`, callback_data: 'dice_game_bet_on_odd' },
                                { text: `${translate[languageState].games.dice.even}`, callback_data: 'dice_game_bet_on_even' },
                            ],
                            [
                                { text: translate[languageState].games.dice.back, callback_data: 'dice_game_back' },
                                { text: translate[languageState].games.dice.throw, callback_data: 'dice_game_play' },
                            ],
                        ]
                    },
                });
                break;
        }
    }
    else if (query.data === 'dice_game_bet_on_2') {
        switch (user.game_info.dice_bet) {
            case position2:
                await bot.editMessageText(diceGameMessage(languageState), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `${translate[languageState].games.dice.bet}: ${user.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },],
                            [
                                { text: '1', callback_data: 'dice_game_bet_on_1' },
                                { text: '2 ✅', callback_data: 'foobar' },
                                { text: '3', callback_data: 'dice_game_bet_on_3' },
                                { text: '4', callback_data: 'dice_game_bet_on_4' },
                                { text: '5', callback_data: 'dice_game_bet_on_5' },
                                { text: '6', callback_data: 'dice_game_bet_on_6' },
                            ],
                            [
                                { text: '1-2', callback_data: 'dice_game_bet_on_1_2' },
                                { text: '3-4', callback_data: 'dice_game_bet_on_3_4' },
                                { text: '5-6', callback_data: 'dice_game_bet_on_5_6' },
                            ],
                            [
                                { text: `${translate[languageState].games.dice.odd}`, callback_data: 'dice_game_bet_on_odd' },
                                { text: `${translate[languageState].games.dice.even}`, callback_data: 'dice_game_bet_on_even' },
                            ],
                            [
                                { text: translate[languageState].games.dice.back, callback_data: 'dice_game_back' },
                                { text: translate[languageState].games.dice.throw, callback_data: 'dice_game_play' },
                            ],
                        ]
                    },
                });
                break;
            default:
                user.game_info.dice_game_position = position2;
                user.save();
                await bot.editMessageText(diceGameMessage(languageState), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `${translate[languageState].games.dice.bet}: ${user.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },],
                            [
                                { text: '1', callback_data: 'dice_game_bet_on_1' },
                                { text: '2 ✅', callback_data: 'foobar' },
                                { text: '3', callback_data: 'dice_game_bet_on_3' },
                                { text: '4', callback_data: 'dice_game_bet_on_4' },
                                { text: '5', callback_data: 'dice_game_bet_on_5' },
                                { text: '6', callback_data: 'dice_game_bet_on_6' },
                            ],
                            [
                                { text: '1-2', callback_data: 'dice_game_bet_on_1_2' },
                                { text: '3-4', callback_data: 'dice_game_bet_on_3_4' },
                                { text: '5-6', callback_data: 'dice_game_bet_on_5_6' },
                            ],
                            [
                                { text: `${translate[languageState].games.dice.odd}`, callback_data: 'dice_game_bet_on_odd' },
                                { text: `${translate[languageState].games.dice.even}`, callback_data: 'dice_game_bet_on_even' },
                            ],
                            [
                                { text: translate[languageState].games.dice.back, callback_data: 'dice_game_back' },
                                { text: translate[languageState].games.dice.throw, callback_data: 'dice_game_play' },
                            ],
                        ]
                    },
                });
                break;
        }
    }
    else if (query.data === 'dice_game_bet_on_3') {
        switch (user.game_info.dice_bet) {
            case position3:
                await bot.editMessageText(diceGameMessage(languageState), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `${translate[languageState].games.dice.bet}: ${user.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },],
                            [
                                { text: '1', callback_data: 'dice_game_bet_on_1' },
                                { text: '2', callback_data: 'dice_game_bet_on_2' },
                                { text: '3 ✅', callback_data: 'foobar' },
                                { text: '4', callback_data: 'dice_game_bet_on_4' },
                                { text: '5', callback_data: 'dice_game_bet_on_5' },
                                { text: '6', callback_data: 'dice_game_bet_on_6' },
                            ],
                            [
                                { text: '1-2', callback_data: 'dice_game_bet_on_1_2' },
                                { text: '3-4', callback_data: 'dice_game_bet_on_3_4' },
                                { text: '5-6', callback_data: 'dice_game_bet_on_5_6' },
                            ],
                            [
                                { text: `${translate[languageState].games.dice.odd}`, callback_data: 'dice_game_bet_on_odd' },
                                { text: `${translate[languageState].games.dice.even}`, callback_data: 'dice_game_bet_on_even' },
                            ],
                            [
                                { text: translate[languageState].games.dice.back, callback_data: 'dice_game_back' },
                                { text: translate[languageState].games.dice.throw, callback_data: 'dice_game_play' },
                            ],
                        ]
                    },
                });
                break;
            default:
                user.game_info.dice_game_position = position3;
                user.save();
                await bot.editMessageText(diceGameMessage(languageState), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `${translate[languageState].games.dice.bet}: ${user.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },],
                            [
                                { text: '1', callback_data: 'dice_game_bet_on_1' },
                                { text: '2', callback_data: 'dice_game_bet_on_2' },
                                { text: '3 ✅', callback_data: 'foobar' },
                                { text: '4', callback_data: 'dice_game_bet_on_4' },
                                { text: '5', callback_data: 'dice_game_bet_on_5' },
                                { text: '6', callback_data: 'dice_game_bet_on_6' },
                            ],
                            [
                                { text: '1-2', callback_data: 'dice_game_bet_on_1_2' },
                                { text: '3-4', callback_data: 'dice_game_bet_on_3_4' },
                                { text: '5-6', callback_data: 'dice_game_bet_on_5_6' },
                            ],
                            [
                                { text: `${translate[languageState].games.dice.odd}`, callback_data: 'dice_game_bet_on_odd' },
                                { text: `${translate[languageState].games.dice.even}`, callback_data: 'dice_game_bet_on_even' },
                            ],
                            [
                                { text: translate[languageState].games.dice.back, callback_data: 'dice_game_back' },
                                { text: translate[languageState].games.dice.throw, callback_data: 'dice_game_play' },
                            ],
                        ]
                    },
                });
                break;
        }
    }
    else if (query.data === 'dice_game_bet_on_4') {
        switch (user.game_info.dice_bet) {
            case position4:
                await bot.editMessageText(diceGameMessage(languageState), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `${translate[languageState].games.dice.bet}: ${user.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },],
                            [
                                { text: '1', callback_data: 'dice_game_bet_on_1' },
                                { text: '2', callback_data: 'dice_game_bet_on_2' },
                                { text: '3', callback_data: 'dice_game_bet_on_3' },
                                { text: '4 ✅', callback_data: 'foobar' },
                                { text: '5', callback_data: 'dice_game_bet_on_5' },
                                { text: '6', callback_data: 'dice_game_bet_on_6' },
                            ],
                            [
                                { text: '1-2', callback_data: 'dice_game_bet_on_1_2' },
                                { text: '3-4', callback_data: 'dice_game_bet_on_3_4' },
                                { text: '5-6', callback_data: 'dice_game_bet_on_5_6' },
                            ],
                            [
                                { text: `${translate[languageState].games.dice.odd}`, callback_data: 'dice_game_bet_on_odd' },
                                { text: `${translate[languageState].games.dice.even}`, callback_data: 'dice_game_bet_on_even' },
                            ],
                            [
                                { text: translate[languageState].games.dice.back, callback_data: 'dice_game_back' },
                                { text: translate[languageState].games.dice.throw, callback_data: 'dice_game_play' },
                            ],
                        ]
                    },
                });
                break;
            default:
                user.game_info.dice_game_position = position4;
                user.save();
                await bot.editMessageText(diceGameMessage(languageState), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `${translate[languageState].games.dice.bet}: ${user.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },],
                            [
                                { text: '1', callback_data: 'dice_game_bet_on_1' },
                                { text: '2', callback_data: 'dice_game_bet_on_2' },
                                { text: '3', callback_data: 'dice_game_bet_on_3' },
                                { text: '4 ✅', callback_data: 'foobar' },
                                { text: '5', callback_data: 'dice_game_bet_on_5' },
                                { text: '6', callback_data: 'dice_game_bet_on_6' },
                            ],
                            [
                                { text: '1-2', callback_data: 'dice_game_bet_on_1_2' },
                                { text: '3-4', callback_data: 'dice_game_bet_on_3_4' },
                                { text: '5-6', callback_data: 'dice_game_bet_on_5_6' },
                            ],
                            [
                                { text: `${translate[languageState].games.dice.odd}`, callback_data: 'dice_game_bet_on_odd' },
                                { text: `${translate[languageState].games.dice.even}`, callback_data: 'dice_game_bet_on_even' },
                            ],
                            [
                                { text: translate[languageState].games.dice.back, callback_data: 'dice_game_back' },
                                { text: translate[languageState].games.dice.throw, callback_data: 'dice_game_play' },
                            ],
                        ]
                    },
                });
                break;
        }
    }
    else if (query.data === 'dice_game_bet_on_5') {
        switch (user.game_info.dice_bet) {
            case position5:
                await bot.editMessageText(diceGameMessage(languageState), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `${translate[languageState].games.dice.bet}: ${user.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },],
                            [
                                { text: '1', callback_data: 'dice_game_bet_on_1' },
                                { text: '2', callback_data: 'dice_game_bet_on_2' },
                                { text: '3', callback_data: 'dice_game_bet_on_3' },
                                { text: '4', callback_data: 'dice_game_bet_on_4' },
                                { text: '5 ✅', callback_data: 'foobar' },
                                { text: '6', callback_data: 'dice_game_bet_on_6' },
                            ],
                            [
                                { text: '1-2', callback_data: 'dice_game_bet_on_1_2' },
                                { text: '3-4', callback_data: 'dice_game_bet_on_3_4' },
                                { text: '5-6', callback_data: 'dice_game_bet_on_5_6' },
                            ],
                            [
                                { text: `${translate[languageState].games.dice.odd}`, callback_data: 'dice_game_bet_on_odd' },
                                { text: `${translate[languageState].games.dice.even}`, callback_data: 'dice_game_bet_on_even' },
                            ],
                            [
                                { text: translate[languageState].games.dice.back, callback_data: 'dice_game_back' },
                                { text: translate[languageState].games.dice.throw, callback_data: 'dice_game_play' },
                            ],
                        ]
                    },
                });
                break;
            default:
                user.game_info.dice_game_position = position5;
                user.save();
                await bot.editMessageText(diceGameMessage(languageState), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `${translate[languageState].games.dice.bet}: ${user.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },],
                            [
                                { text: '1', callback_data: 'dice_game_bet_on_1' },
                                { text: '2', callback_data: 'dice_game_bet_on_2' },
                                { text: '3', callback_data: 'dice_game_bet_on_3' },
                                { text: '4', callback_data: 'dice_game_bet_on_4' },
                                { text: '5 ✅', callback_data: 'foobar' },
                                { text: '6', callback_data: 'dice_game_bet_on_6' },
                            ],
                            [
                                { text: '1-2', callback_data: 'dice_game_bet_on_1_2' },
                                { text: '3-4', callback_data: 'dice_game_bet_on_3_4' },
                                { text: '5-6', callback_data: 'dice_game_bet_on_5_6' },
                            ],
                            [
                                { text: `${translate[languageState].games.dice.odd}`, callback_data: 'dice_game_bet_on_odd' },
                                { text: `${translate[languageState].games.dice.even}`, callback_data: 'dice_game_bet_on_even' },
                            ],
                            [
                                { text: translate[languageState].games.dice.back, callback_data: 'dice_game_back' },
                                { text: translate[languageState].games.dice.throw, callback_data: 'dice_game_play' },
                            ],
                        ]
                    },
                });
                break;
        }
    }
    else if (query.data === 'dice_game_bet_on_6') {
        switch (user.game_info.dice_bet) {
            case position6:
                await bot.editMessageText(diceGameMessage(languageState), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `${translate[languageState].games.dice.bet}: ${user.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },],
                            [
                                { text: '1', callback_data: 'dice_game_bet_on_1' },
                                { text: 2, callback_data: 'dice_game_bet_on_2' },
                                { text: '3', callback_data: 'dice_game_bet_on_3' },
                                { text: '4', callback_data: 'dice_game_bet_on_4' },
                                { text: '5', callback_data: 'dice_game_bet_on_5' },
                                { text: '6 ✅', callback_data: 'foobar' },
                            ],
                            [
                                { text: '1-2', callback_data: 'dice_game_bet_on_1_2' },
                                { text: '3-4', callback_data: 'dice_game_bet_on_3_4' },
                                { text: '5-6', callback_data: 'dice_game_bet_on_5_6' },
                            ],
                            [
                                { text: `${translate[languageState].games.dice.odd}`, callback_data: 'dice_game_bet_on_odd' },
                                { text: `${translate[languageState].games.dice.even}`, callback_data: 'dice_game_bet_on_even' },
                            ],
                            [
                                { text: translate[languageState].games.dice.back, callback_data: 'dice_game_back' },
                                { text: translate[languageState].games.dice.throw, callback_data: 'dice_game_play' },
                            ],
                        ]
                    },
                });
                break;
            default:
                user.game_info.dice_game_position = position6;
                user.save();
                await bot.editMessageText(diceGameMessage(languageState), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `${translate[languageState].games.dice.bet}: ${user.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },],
                            [
                                { text: '1', callback_data: 'dice_game_bet_on_1' },
                                { text: 2, callback_data: 'dice_game_bet_on_2' },
                                { text: '3', callback_data: 'dice_game_bet_on_3' },
                                { text: '4', callback_data: 'dice_game_bet_on_4' },
                                { text: '5', callback_data: 'dice_game_bet_on_5' },
                                { text: '6 ✅', callback_data: 'foobar' },
                            ],
                            [
                                { text: '1-2', callback_data: 'dice_game_bet_on_1_2' },
                                { text: '3-4', callback_data: 'dice_game_bet_on_3_4' },
                                { text: '5-6', callback_data: 'dice_game_bet_on_5_6' },
                            ],
                            [
                                { text: `${translate[languageState].games.dice.odd}`, callback_data: 'dice_game_bet_on_odd' },
                                { text: `${translate[languageState].games.dice.even}`, callback_data: 'dice_game_bet_on_even' },
                            ],
                            [
                                { text: translate[languageState].games.dice.back, callback_data: 'dice_game_back' },
                                { text: translate[languageState].games.dice.throw, callback_data: 'dice_game_play' },
                            ],
                        ]
                    },
                });
                break;
        }
    }
    else if (query.data === 'dice_game_bet_on_1_2') {
        switch (user.game_info.dice_bet) {
            case position12:
                await bot.editMessageText(diceGameMessage(languageState), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `${translate[languageState].games.dice.bet}: ${user.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },],
                            [
                                { text: '1', callback_data: 'dice_game_bet_on_1' },
                                { text: 2, callback_data: 'dice_game_bet_on_2' },
                                { text: '3', callback_data: 'dice_game_bet_on_3' },
                                { text: '4', callback_data: 'dice_game_bet_on_4' },
                                { text: '5', callback_data: 'dice_game_bet_on_5' },
                                { text: '6', callback_data: 'dice_game_bet_on_6' },
                            ],
                            [
                                { text: '1-2 ✅', callback_data: 'foobar' },
                                { text: '3-4', callback_data: 'dice_game_bet_on_3_4' },
                                { text: '5-6', callback_data: 'dice_game_bet_on_5_6' },
                            ],
                            [
                                { text: `${translate[languageState].games.dice.odd}`, callback_data: 'dice_game_bet_on_odd' },
                                { text: `${translate[languageState].games.dice.even}`, callback_data: 'dice_game_bet_on_even' },
                            ],
                            [
                                { text: translate[languageState].games.dice.back, callback_data: 'dice_game_back' },
                                { text: translate[languageState].games.dice.throw, callback_data: 'dice_game_play' },
                            ],
                        ]
                    },
                });
                break;
            default:
                user.game_info.dice_game_position = position12;
                user.save();
                await bot.editMessageText(diceGameMessage(languageState), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `${translate[languageState].games.dice.bet}: ${user.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },],
                            [
                                { text: '1', callback_data: 'dice_game_bet_on_1' },
                                { text: 2, callback_data: 'dice_game_bet_on_2' },
                                { text: '3', callback_data: 'dice_game_bet_on_3' },
                                { text: '4', callback_data: 'dice_game_bet_on_4' },
                                { text: '5', callback_data: 'dice_game_bet_on_5' },
                                { text: '6', callback_data: 'dice_game_bet_on_6' },
                            ],
                            [
                                { text: '1-2 ✅', callback_data: 'foobar' },
                                { text: '3-4', callback_data: 'dice_game_bet_on_3_4' },
                                { text: '5-6', callback_data: 'dice_game_bet_on_5_6' },
                            ],
                            [
                                { text: `${translate[languageState].games.dice.odd}`, callback_data: 'dice_game_bet_on_odd' },
                                { text: `${translate[languageState].games.dice.even}`, callback_data: 'dice_game_bet_on_even' },
                            ],
                            [
                                { text: translate[languageState].games.dice.back, callback_data: 'dice_game_back' },
                                { text: translate[languageState].games.dice.throw, callback_data: 'dice_game_play' },
                            ],
                        ]
                    },
                });
                break;
        }
    }
    else if (query.data === 'dice_game_bet_on_3_4') {
        switch (user.game_info.dice_bet) {
            case position34:
                await bot.editMessageText(diceGameMessage(languageState), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `${translate[languageState].games.dice.bet}: ${user.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },],
                            [
                                { text: '1', callback_data: 'dice_game_bet_on_1' },
                                { text: 2, callback_data: 'dice_game_bet_on_2' },
                                { text: '3', callback_data: 'dice_game_bet_on_3' },
                                { text: '4', callback_data: 'dice_game_bet_on_4' },
                                { text: '5', callback_data: 'dice_game_bet_on_5' },
                                { text: '6', callback_data: 'dice_game_bet_on_6' },
                            ],
                            [
                                { text: '1-2', callback_data: 'dice_game_bet_on_1_2' },
                                { text: '3-4 ✅', callback_data: 'foobar' },
                                { text: '5-6', callback_data: 'dice_game_bet_on_5_6' },
                            ],
                            [
                                { text: `${translate[languageState].games.dice.odd}`, callback_data: 'dice_game_bet_on_odd' },
                                { text: `${translate[languageState].games.dice.even}`, callback_data: 'dice_game_bet_on_even' },
                            ],
                            [
                                { text: translate[languageState].games.dice.back, callback_data: 'dice_game_back' },
                                { text: translate[languageState].games.dice.throw, callback_data: 'dice_game_play' },
                            ],
                        ]
                    },
                });
                break;
            default:
                user.game_info.dice_game_position = position34;
                user.save();
                await bot.editMessageText(diceGameMessage(languageState), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `${translate[languageState].games.dice.bet}: ${user.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },],
                            [
                                { text: '1', callback_data: 'dice_game_bet_on_1' },
                                { text: 2, callback_data: 'dice_game_bet_on_2' },
                                { text: '3', callback_data: 'dice_game_bet_on_3' },
                                { text: '4', callback_data: 'dice_game_bet_on_4' },
                                { text: '5', callback_data: 'dice_game_bet_on_5' },
                                { text: '6', callback_data: 'dice_game_bet_on_6' },
                            ],
                            [
                                { text: '1-2', callback_data: 'dice_game_bet_on_1_2' },
                                { text: '3-4 ✅', callback_data: 'foobar' },
                                { text: '5-6', callback_data: 'dice_game_bet_on_5_6' },
                            ],
                            [
                                { text: `${translate[languageState].games.dice.odd}`, callback_data: 'dice_game_bet_on_odd' },
                                { text: `${translate[languageState].games.dice.even}`, callback_data: 'dice_game_bet_on_even' },
                            ],
                            [
                                { text: translate[languageState].games.dice.back, callback_data: 'dice_game_back' },
                                { text: translate[languageState].games.dice.throw, callback_data: 'dice_game_play' },
                            ],
                        ]
                    },
                });
                break;
        }
    }
    else if (query.data === 'dice_game_bet_on_5_6') {
        switch (user.game_info.dice_bet) {
            case position56:
                await bot.editMessageText(diceGameMessage(languageState), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `${translate[languageState].games.dice.bet}: ${user.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },],
                            [
                                { text: '1', callback_data: 'dice_game_bet_on_1' },
                                { text: '2', callback_data: 'dice_game_bet_on_2' },
                                { text: '3', callback_data: 'dice_game_bet_on_3' },
                                { text: '4', callback_data: 'dice_game_bet_on_4' },
                                { text: '5', callback_data: 'dice_game_bet_on_5' },
                                { text: '6', callback_data: 'dice_game_bet_on_6' },
                            ],
                            [
                                { text: '1-2', callback_data: 'dice_game_bet_on_1_2' },
                                { text: '3-4', callback_data: 'dice_game_bet_on_3_4' },
                                { text: '5-6 ✅', callback_data: 'foobar' },
                            ],
                            [
                                { text: `${translate[languageState].games.dice.odd}`, callback_data: 'dice_game_bet_on_odd' },
                                { text: `${translate[languageState].games.dice.even}`, callback_data: 'dice_game_bet_on_even' },
                            ],
                            [
                                { text: translate[languageState].games.dice.back, callback_data: 'dice_game_back' },
                                { text: translate[languageState].games.dice.throw, callback_data: 'dice_game_play' },
                            ],
                        ]
                    },
                });
                break;
            default:
                user.game_info.dice_game_position = position56;
                user.save();
                await bot.editMessageText(diceGameMessage(languageState), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `${translate[languageState].games.dice.bet}: ${user.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },],
                            [
                                { text: '1', callback_data: 'dice_game_bet_on_1' },
                                { text: '2', callback_data: 'dice_game_bet_on_2' },
                                { text: '3', callback_data: 'dice_game_bet_on_3' },
                                { text: '4', callback_data: 'dice_game_bet_on_4' },
                                { text: '5', callback_data: 'dice_game_bet_on_5' },
                                { text: '6', callback_data: 'dice_game_bet_on_6' },
                            ],
                            [
                                { text: '1-2', callback_data: 'dice_game_bet_on_1_2' },
                                { text: '3-4', callback_data: 'dice_game_bet_on_3_4' },
                                { text: '5-6 ✅', callback_data: 'foobar' },
                            ],
                            [
                                { text: `${translate[languageState].games.dice.odd}`, callback_data: 'dice_game_bet_on_odd' },
                                { text: `${translate[languageState].games.dice.even}`, callback_data: 'dice_game_bet_on_even' },
                            ],
                            [
                                { text: translate[languageState].games.dice.back, callback_data: 'dice_game_back' },
                                { text: translate[languageState].games.dice.throw, callback_data: 'dice_game_play' },
                            ],
                        ]
                    },
                });
                break;
        }
    }
    else if (query.data === 'dice_game_bet_on_odd') {
        switch (user.game_info.dice_bet) {
            case positionOdd:
                await bot.editMessageText(diceGameMessage(languageState), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `${translate[languageState].games.dice.bet}: ${user.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },],
                            [
                                { text: '1', callback_data: 'dice_game_bet_on_1' },
                                { text: '2', callback_data: 'dice_game_bet_on_2' },
                                { text: '3', callback_data: 'dice_game_bet_on_3' },
                                { text: '4', callback_data: 'dice_game_bet_on_4' },
                                { text: '5', callback_data: 'dice_game_bet_on_5' },
                                { text: '6', callback_data: 'dice_game_bet_on_6' },
                            ],
                            [
                                { text: '1-2', callback_data: 'dice_game_bet_on_1_2' },
                                { text: '3-4', callback_data: 'dice_game_bet_on_3_4' },
                                { text: '5-6', callback_data: 'dice_game_bet_on_5_6' },
                            ],
                            [
                                { text: `${translate[languageState].games.dice.odd} ✅`, callback_data: 'foobar' },
                                { text: translate[languageState].games.dice.even, callback_data: 'dice_game_bet_on_even' },
                            ],
                            [
                                { text: translate[languageState].games.dice.back, callback_data: 'dice_game_back' },
                                { text: translate[languageState].games.dice.throw, callback_data: 'dice_game_play' },
                            ],
                        ]
                    },
                });
                break;
            default:
                user.game_info.dice_game_position = positionOdd;
                user.save();
                await bot.editMessageText(diceGameMessage(languageState), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `${translate[languageState].games.dice.bet}: ${user.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },],
                            [
                                { text: '1', callback_data: 'dice_game_bet_on_1' },
                                { text: '2', callback_data: 'dice_game_bet_on_2' },
                                { text: '3', callback_data: 'dice_game_bet_on_3' },
                                { text: '4', callback_data: 'dice_game_bet_on_4' },
                                { text: '5', callback_data: 'dice_game_bet_on_5' },
                                { text: '6', callback_data: 'dice_game_bet_on_6' },
                            ],
                            [
                                { text: '1-2', callback_data: 'dice_game_bet_on_1_2' },
                                { text: '3-4', callback_data: 'dice_game_bet_on_3_4' },
                                { text: '5-6', callback_data: 'dice_game_bet_on_5_6' },
                            ],
                            [
                                { text: `${translate[languageState].games.dice.odd} ✅`, callback_data: 'foobar' },
                                { text: `${translate[languageState].games.dice.even}`, callback_data: 'dice_game_bet_on_even' },
                            ],
                            [
                                { text: translate[languageState].games.dice.back, callback_data: 'dice_game_back' },
                                { text: translate[languageState].games.dice.throw, callback_data: 'dice_game_play' },
                            ],
                        ]
                    },
                });
                break;
        }
    }
    else if (query.data === 'dice_game_bet_on_even') {
        switch (user.game_info.dice_bet) {
            case positionEven:
                await bot.editMessageText(diceGameMessage(languageState), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `${translate[languageState].games.dice.bet}: ${user.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },],
                            [
                                { text: '1', callback_data: 'dice_game_bet_on_1' },
                                { text: '2', callback_data: 'dice_game_bet_on_2' },
                                { text: '3', callback_data: 'dice_game_bet_on_3' },
                                { text: '4', callback_data: 'dice_game_bet_on_4' },
                                { text: '5', callback_data: 'dice_game_bet_on_5' },
                                { text: '6', callback_data: 'dice_game_bet_on_1_2' },
                            ],
                            [
                                { text: '1-2', callback_data: 'dice_game_bet_on_1_2' },
                                { text: '3-4', callback_data: 'dice_game_bet_on_4_5' },
                                { text: '5-6', callback_data: 'dice_game_bet_on_5_6' },
                            ],
                            [
                                { text: `${translate[languageState].games.dice.odd}`, callback_data: 'dice_game_bet_on_odd' },
                                { text: `${translate[languageState].games.dice.even} ✅`, callback_data: 'foobar' },
                            ],
                            [
                                { text: translate[languageState].games.dice.back, callback_data: 'dice_game_back' },
                                { text: translate[languageState].games.dice.throw, callback_data: 'dice_game_play' },
                            ],
                        ]
                    },
                });
                break;
            default:
                user.game_info.dice_game_position = positionEven;
                user.save();
                await bot.editMessageText(diceGameMessage(languageState), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `${translate[languageState].games.dice.bet}: ${user.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },],
                            [
                                { text: '1', callback_data: 'dice_game_bet_on_1' },
                                { text: '2', callback_data: 'dice_game_bet_on_2' },
                                { text: '3', callback_data: 'dice_game_bet_on_3' },
                                { text: '4', callback_data: 'dice_game_bet_on_4' },
                                { text: '5', callback_data: 'dice_game_bet_on_5' },
                                { text: '6', callback_data: 'dice_game_bet_on_1_2' },
                            ],
                            [
                                { text: '1-2', callback_data: 'dice_game_bet_on_1_2' },
                                { text: '3-4', callback_data: 'dice_game_bet_on_3_4' },
                                { text: '5-6', callback_data: 'dice_game_bet_on_5_6' },
                            ],
                            [
                                { text: `${translate[languageState].games.dice.odd}`, callback_data: 'dice_game_bet_on_odd' },
                                { text: `${translate[languageState].games.dice.even} ✅`, callback_data: 'foobar' },
                            ],
                            [
                                { text: translate[languageState].games.dice.back, callback_data: 'dice_game_back' },
                                { text: translate[languageState].games.dice.throw, callback_data: 'dice_game_play' },
                            ],
                        ]
                    },
                });
                break;
        }
    }
    else if (query.data === 'dice_game_bet_value_') {
        if (user.profile.balance < 0.1) {
            await bot.editMessageText(diceBetMessage(languageState, user), {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: slotLowBalance(languageState).reply_markup,
            });
        }
        else {
            await bot.editMessageText(diceBetMessage(languageState, user), {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '-', callback_data: 'dice_bet_minus' },
                            { text: betButton(user.game_info.dice_bet), callback_data: 'dice_bet_____' },
                            { text: '+', callback_data: 'dice_bet_plus' },
                        ],
                        [

                            { text: translate[languageState].games.slots.min, callback_data: 'dice_bet_min' },
                            { text: translate[languageState].games.slots.double, callback_data: 'dice_bet_double' },
                            { text: translate[languageState].games.slots.max, callback_data: 'dice_bet_max' },
                        ],
                        [

                            { text: translate[languageState].games.slots.slot_game_back, callback_data: 'dice_bet_back' },
                        ],
                    ],
                },
            });
        };
    }
    // dice bet config
    else if (query.data === 'dice_bet_back') {
        await bot.editMessageText(diceGameMessage(languageState), {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: `${translate[languageState].games.dice.bet}: ${user.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },
                    ],
                    [
                        { text: 1, callback_data: 'dice_game_bet_on_1' },
                        { text: 2, callback_data: 'dice_game_bet_on_2' },
                        { text: 3, callback_data: 'dice_game_bet_on_3' },
                        { text: 4, callback_data: 'dice_game_bet_on_4' },
                        { text: 5, callback_data: 'dice_game_bet_on_5' },
                        { text: 6, callback_data: 'dice_game_bet_on_6' },
                    ],
                    [
                        { text: '1-2', callback_data: 'dice_game_bet_on_1_2' },
                        { text: '3-4', callback_data: 'dice_game_bet_on_3_4' },
                        { text: '5-6', callback_data: 'dice_game_bet_on_5_6' },
                    ],
                    [
                        { text: translate[languageState].games.dice.odd, callback_data: 'dice_game_bet_on_odd' },
                        { text: translate[languageState].games.dice.even, callback_data: 'dice_game_bet_on_even' },
                    ],
                    [
                        { text: translate[languageState].games.dice.back, callback_data: 'dice_game_back' },
                        { text: translate[languageState].games.dice.throw, callback_data: 'dice_game_play' },
                    ],
                ]
            },
        });
    }
    else if (query.data === 'dice_bet_minus') {
        switch (user.game_info.dice_bet) {
            case dice_bet = 0.1:
                await bot.editMessageText(diceBetMessage(languageState, user), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '-', callback_data: 'foobar' },
                                { text: betButton(user.game_info.dice_bet), callback_data: 'dice_bet_____' },
                                { text: '+', callback_data: 'dice_bet_plus' },
                            ],
                            [

                                { text: translate[languageState].games.slots.min, callback_data: 'dice_bet_min' },
                                { text: translate[languageState].games.slots.double, callback_data: 'dice_bet_double' },
                                { text: translate[languageState].games.slots.max, callback_data: 'dice_bet_double' },
                            ],
                            [

                                { text: translate[languageState].games.slots.slot_game_back, callback_data: 'dice_bet_back' },
                            ],
                        ],
                    },
                });
                break;
            default:
                newDiceBet = user.game_info.dice_bet
                newDiceBet = newDiceBet - 0.1
                newDiceBet = parseFloat(newDiceBet)
                newDiceBet = newDiceBet.toFixed(2)
                user.game_info.dice_bet = parseFloat(newDiceBet)
                user.save()
                await bot.editMessageText(diceBetMessage(languageState, user), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '-', callback_data: 'dice_bet_minus' },
                                { text: betButton(user.game_info.dice_bet), callback_data: 'dice_bet_____' },
                                { text: '+', callback_data: 'dice_bet_plus' },
                            ],
                            [

                                { text: translate[languageState].games.slots.min, callback_data: 'dice_bet_min' },
                                { text: translate[languageState].games.slots.double, callback_data: 'dice_bet_double' },
                                { text: translate[languageState].games.slots.max, callback_data: 'dice_bet_max' },
                            ],
                            [

                                { text: translate[languageState].games.slots.slot_game_back, callback_data: 'dice_bet_back' },
                            ],
                        ],
                    },
                });
                break;
        };
    }
    else if (query.data === 'dice_bet_plus') {
        switch (user.game_info.dice_bet) {
            case dice_bet = 100:
                await bot.editMessageText(diceBetMessage(languageState, user), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '-', callback_data: 'dice_bet_minus' },
                                { text: betButton(user.game_info.dice_bet), callback_data: 'dice_bet_____' },
                                { text: '+', callback_data: 'foobar' },
                            ],
                            [

                                { text: translate[languageState].games.slots.min, callback_data: 'dice_bet_min' },
                                { text: translate[languageState].games.slots.double, callback_data: 'dice_bet_double' },
                                { text: translate[languageState].games.slots.max, callback_data: 'dice_bet_max' },
                            ],
                            [

                                { text: translate[languageState].games.slots.slot_game_back, callback_data: 'dice_bet_back' },
                            ],
                        ],
                    },
                });
                break;
            default:
                newDiceBet = user.game_info.dice_bet
                newDiceBet = newDiceBet + 0.1
                newDiceBet = parseFloat(newDiceBet)
                newDiceBet = newDiceBet.toFixed(2)
                user.game_info.dice_bet = parseFloat(newDiceBet)
                user.save()
                await bot.editMessageText(diceBetMessage(languageState, user), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '-', callback_data: 'dice_bet_minus' },
                                { text: betButton(user.game_info.dice_bet), callback_data: 'dice_bet_____' },
                                { text: '+', callback_data: 'dice_bet_plus' },
                            ],
                            [

                                { text: translate[languageState].games.slots.min, callback_data: 'dice_bet_min' },
                                { text: translate[languageState].games.slots.double, callback_data: 'dice_bet_double' },
                                { text: translate[languageState].games.slots.max, callback_data: 'dice_bet_max' },
                            ],
                            [

                                { text: translate[languageState].games.slots.slot_game_back, callback_data: 'dice_bet_back' },
                            ],
                        ],
                    },
                });
                break;
        };
    }
    else if (query.data === 'dice_bet_min') {
        switch (user.game_info.dice_bet) {
            case 0.1:
                await bot.editMessageText(diceBetMessage(languageState, user), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '-', callback_data: 'dice_bet_minus' },
                                { text: betButton(user.game_info.dice_bet), callback_data: 'slot_game_____' },
                                { text: '+', callback_data: 'dice_bet_plus' },
                            ],
                            [

                                { text: translate[languageState].games.slots.min, callback_data: 'foobar' },
                                { text: translate[languageState].games.slots.double, callback_data: 'dice_bet_double' },
                                { text: translate[languageState].games.slots.max, callback_data: 'dice_bet_max' },
                            ],
                            [

                                { text: translate[languageState].games.slots.slot_game_back, callback_data: 'dice_bet_back' },
                            ],
                        ],
                    },
                });
                break;
            default:
                newDiceBet = user.game_info.dice_bet
                newDiceBet = 0.1
                newDiceBet = parseFloat(newDiceBet)
                newDiceBet = newDiceBet.toFixed(2)
                user.game_info.dice_bet = parseFloat(newDiceBet)
                user.save()
                await bot.editMessageText(diceBetMessage(languageState, user), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '-', callback_data: 'dice_bet_minus' },
                                { text: betButton(user.game_info.dice_bet), callback_data: 'slot_game_____' },
                                { text: '+', callback_data: 'dice_bet_plus' },
                            ],
                            [

                                { text: translate[languageState].games.slots.min, callback_data: 'dice_bet_min' },
                                { text: translate[languageState].games.slots.double, callback_data: 'dice_bet_double' },
                                { text: translate[languageState].games.slots.max, callback_data: 'dice_bet_max' },
                            ],
                            [

                                { text: translate[languageState].games.slots.slot_game_back, callback_data: 'dice_bet_back' },
                            ],
                        ],
                    },
                });
                break;
        };
    }
    else if (query.data === 'dice_bet_double') {
        if (user.game_info.dice_bet > 50) {
            console.log(123)

            console.log(user)
            await bot.editMessageText(diceBetMessage(languageState, user), {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '-', callback_data: 'dice_bet_minus' },
                            { text: betButton(user.game_info.dice_bet), callback_data: 'slot_game_____' },
                            { text: '+', callback_data: 'dice_bet_plus' },
                        ],
                        [

                            { text: translate[languageState].games.slots.min, callback_data: 'dice_bet_min' },
                            { text: translate[languageState].games.slots.double, callback_data: 'foobar' },
                            { text: translate[languageState].games.slots.max, callback_data: 'dice_bet_max' },
                        ],
                        [

                            { text: translate[languageState].games.slots.slot_game_back, callback_data: 'dice_bet_back' },
                        ],
                    ],
                },
            });
        }
        else {
            console.log(user)
            newDiceBet = user.game_info.dice_bet
            newDiceBet = newDiceBet * 2
            newDiceBet = parseFloat(newDiceBet)
            newDiceBet = newDiceBet.toFixed(2)
            user.game_info.dice_bet = parseFloat(newDiceBet)
            user.save()
            await bot.editMessageText(diceBetMessage(languageState, user), {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '-', callback_data: 'dice_bet_minus' },
                            { text: betButton(user.game_info.dice_bet), callback_data: 'slot_game_____' },
                            { text: '+', callback_data: 'dice_bet_plus' },
                        ],
                        [

                            { text: translate[languageState].games.slots.min, callback_data: 'dice_bet_min' },
                            { text: translate[languageState].games.slots.double, callback_data: 'dice_bet_double' },
                            { text: translate[languageState].games.slots.max, callback_data: 'dice_bet_max' },
                        ],
                        [

                            { text: translate[languageState].games.slots.slot_game_back, callback_data: 'dice_bet_back' },
                        ],
                    ],
                },
            });
        }

    }
    else if (query.data === 'dice_bet_max') {
        switch (user.game_info.dice_bet) {
            case dice_bet = 100:
                await bot.editMessageText(diceBetMessage(languageState, user), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '-', callback_data: 'dice_bet_minus' },
                                { text: betButton(user.game_info.dice_bet), callback_data: 'slot_game_____' },
                                { text: '+', callback_data: 'dice_bet_plus' },
                            ],
                            [

                                { text: translate[languageState].games.slots.min, callback_data: 'dice_bet_min' },
                                { text: translate[languageState].games.slots.double, callback_data: 'dice_bet_double' },
                                { text: translate[languageState].games.slots.max, callback_data: 'foobar' },
                            ],
                            [

                                { text: translate[languageState].games.slots.slot_game_back, callback_data: 'dice_bet_back' },
                            ],
                        ],
                    },
                });
                break;
            default:
                newDiceBet = user.game_info.dice_bet
                newDiceBet = 100
                newDiceBet = parseFloat(newDiceBet)
                newDiceBet = newDiceBet.toFixed(2)
                user.game_info.dice_bet = parseFloat(newDiceBet)
                user.save()
                await bot.editMessageText(diceBetMessage(languageState, user), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '-', callback_data: 'dice_bet_minus' },
                                { text: betButton(user.game_info.dice_bet), callback_data: 'slot_game_____' },
                                { text: '+', callback_data: 'dice_bet_plus' },
                            ],
                            [

                                { text: translate[languageState].games.slots.min, callback_data: 'dice_bet_min' },
                                { text: translate[languageState].games.slots.double, callback_data: 'dice_bet_double' },
                                { text: translate[languageState].games.slots.max, callback_data: 'dice_bet_max' },
                            ],
                            [

                                { text: translate[languageState].games.slots.slot_game_back, callback_data: 'dice_bet_back' },
                            ],
                        ],
                    },
                });
                break;
        };
    }
    else if (query.data === 'dice_game_play') {
        const playerPositionInDiceGame = JSON.stringify(user.game_info.dice_game_position)

        if (user.game_info.dice_bet > user.profile.balance) {
            bot.sendMessage(chatId, '[**No balance]', deleteMessage);
        }
        else if (playerPositionInDiceGame.length < 3) {
            bot.sendMessage(chatId, '[**Place Bet]', deleteMessage)
        }
        else {

            let referralUser = await allUsers.findOne({ _id: user.referral_info.referral_who_invited_id });

            // // emoji
            const emoji = `🎲️`;
            // //
            let diceWinBet;

            const reply_markupOtions = async (b, c) => {
                let result = {};
                const gamePosition = JSON.stringify(b.game_info.dice_game_position);
                if (gamePosition === JSON.stringify(position1)) {
                    result = {
                        reply_markup:
                        {
                            inline_keyboard: [
                                [
                                    { text: `${translate[c].games.dice.bet}: ${b.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },
                                ],
                                [
                                    { text: '1 ✅', callback_data: 'foobar' },
                                    { text: '2', callback_data: 'dice_game_bet_on_2' },
                                    { text: '3', callback_data: 'dice_game_bet_on_3' },
                                    { text: '4', callback_data: 'dice_game_bet_on_4' },
                                    { text: '5', callback_data: 'dice_game_bet_on_5' },
                                    { text: '6', callback_data: 'dice_game_bet_on_6' },
                                ],
                                [
                                    { text: '1-2', callback_data: 'dice_game_bet_on_1_2' },
                                    { text: '3-4', callback_data: 'dice_game_bet_on_3_4' },
                                    { text: '5-6', callback_data: 'dice_game_bet_on_5_6' },
                                ],
                                [
                                    { text: `${translate[c].games.dice.odd}`, callback_data: 'dice_game_bet_on_odd' },
                                    { text: `${translate[c].games.dice.even}`, callback_data: 'dice_game_bet_on_even' },
                                ],
                                [
                                    { text: translate[c].games.dice.back, callback_data: 'dice_game_back' },
                                    { text: translate[c].games.dice.throw, callback_data: 'dice_game_play' },
                                ],
                            ]
                        }
                    }
                }
                else if (gamePosition === JSON.stringify(position2)) {
                    result = {
                        reply_markup:
                        {
                            inline_keyboard: [
                                [
                                    { text: `${translate[c].games.dice.bet}: ${b.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },
                                ],
                                [
                                    { text: '1', callback_data: 'dice_game_bet_on_1' },
                                    { text: '2 ✅', callback_data: 'foobar' },
                                    { text: '3', callback_data: 'dice_game_bet_on_3' },
                                    { text: '4', callback_data: 'dice_game_bet_on_4' },
                                    { text: '5', callback_data: 'dice_game_bet_on_5' },
                                    { text: '6', callback_data: 'dice_game_bet_on_6' },
                                ],
                                [
                                    { text: '1-2', callback_data: 'dice_game_bet_on_1_2' },
                                    { text: '3-4', callback_data: 'dice_game_bet_on_3_4' },
                                    { text: '5-6', callback_data: 'dice_game_bet_on_5_6' },
                                ],
                                [
                                    { text: `${translate[c].games.dice.odd}`, callback_data: 'dice_game_bet_on_odd' },
                                    { text: `${translate[c].games.dice.even}`, callback_data: 'dice_game_bet_on_even' },
                                ],
                                [
                                    { text: translate[c].games.dice.back, callback_data: 'dice_game_back' },
                                    { text: translate[c].games.dice.throw, callback_data: 'dice_game_play' },
                                ],
                            ]
                        }
                    }
                }
                else if (gamePosition === JSON.stringify(position3)) {
                    result = {
                        reply_markup:
                        {
                            inline_keyboard: [
                                [
                                    { text: `${translate[c].games.dice.bet}: ${b.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },
                                ],
                                [
                                    { text: '1', callback_data: 'dice_game_bet_on_1' },
                                    { text: '2', callback_data: 'dice_game_bet_on_2' },
                                    { text: '3 ✅', callback_data: 'foobar' },
                                    { text: '4', callback_data: 'dice_game_bet_on_4' },
                                    { text: '5', callback_data: 'dice_game_bet_on_5' },
                                    { text: '6', callback_data: 'dice_game_bet_on_6' },
                                ],
                                [
                                    { text: '1-2', callback_data: 'dice_game_bet_on_1_2' },
                                    { text: '3-4', callback_data: 'dice_game_bet_on_3_4' },
                                    { text: '5-6', callback_data: 'dice_game_bet_on_5_6' },
                                ],
                                [
                                    { text: `${translate[c].games.dice.odd}`, callback_data: 'dice_game_bet_on_odd' },
                                    { text: `${translate[c].games.dice.even}`, callback_data: 'dice_game_bet_on_even' },
                                ],
                                [
                                    { text: translate[c].games.dice.back, callback_data: 'dice_game_back' },
                                    { text: translate[c].games.dice.throw, callback_data: 'dice_game_play' },
                                ],
                            ]
                        }
                    }
                }
                else if (gamePosition === JSON.stringify(position4)) {
                    result = {
                        reply_markup:
                        {
                            inline_keyboard: [
                                [
                                    { text: `${translate[c].games.dice.bet}: ${b.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },
                                ],
                                [
                                    { text: '1', callback_data: 'dice_game_bet_on_1' },
                                    { text: '2', callback_data: 'dice_game_bet_on_2' },
                                    { text: '3', callback_data: 'dice_game_bet_on_3' },
                                    { text: '4 ✅', callback_data: 'foobar' },
                                    { text: '5', callback_data: 'dice_game_bet_on_5' },
                                    { text: '6', callback_data: 'dice_game_bet_on_6' },
                                ],
                                [
                                    { text: '1-2', callback_data: 'dice_game_bet_on_1_2' },
                                    { text: '3-4', callback_data: 'dice_game_bet_on_3_4' },
                                    { text: '5-6', callback_data: 'dice_game_bet_on_5_6' },
                                ],
                                [
                                    { text: `${translate[c].games.dice.odd}`, callback_data: 'dice_game_bet_on_odd' },
                                    { text: `${translate[c].games.dice.even}`, callback_data: 'dice_game_bet_on_even' },
                                ],
                                [
                                    { text: translate[c].games.dice.back, callback_data: 'dice_game_back' },
                                    { text: translate[c].games.dice.throw, callback_data: 'dice_game_play' },
                                ],
                            ]
                        }
                    }
                }
                else if (gamePosition === JSON.stringify(position5)) {
                    result = {
                        reply_markup:
                        {
                            inline_keyboard: [
                                [
                                    { text: `${translate[c].games.dice.bet}: ${b.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },
                                ],
                                [
                                    { text: '1', callback_data: 'dice_game_bet_on_1' },
                                    { text: '2', callback_data: 'dice_game_bet_on_2' },
                                    { text: '3', callback_data: 'dice_game_bet_on_3' },
                                    { text: '4', callback_data: 'dice_game_bet_on_4' },
                                    { text: '5 ✅', callback_data: 'foobar' },
                                    { text: '6', callback_data: 'dice_game_bet_on_6' },
                                ],
                                [
                                    { text: '1-2', callback_data: 'dice_game_bet_on_1_2' },
                                    { text: '3-4', callback_data: 'dice_game_bet_on_3_4' },
                                    { text: '5-6', callback_data: 'dice_game_bet_on_5_6' },
                                ],
                                [
                                    { text: `${translate[c].games.dice.odd}`, callback_data: 'dice_game_bet_on_odd' },
                                    { text: `${translate[c].games.dice.even}`, callback_data: 'dice_game_bet_on_even' },
                                ],
                                [
                                    { text: translate[c].games.dice.back, callback_data: 'dice_game_back' },
                                    { text: translate[c].games.dice.throw, callback_data: 'dice_game_play' },
                                ],
                            ]
                        }
                    }
                }
                else if (gamePosition === JSON.stringify(position6)) {
                    result = {
                        reply_markup:
                        {
                            inline_keyboard: [
                                [
                                    { text: `${translate[c].games.dice.bet}: ${b.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },
                                ],
                                [
                                    { text: '1', callback_data: 'dice_game_bet_on_1' },
                                    { text: '2', callback_data: 'dice_game_bet_on_2' },
                                    { text: '3', callback_data: 'dice_game_bet_on_3' },
                                    { text: '4', callback_data: 'dice_game_bet_on_4' },
                                    { text: '5', callback_data: 'dice_game_bet_on_5' },
                                    { text: '6 ✅', callback_data: 'foobar' },
                                ],
                                [
                                    { text: '1-2', callback_data: 'dice_game_bet_on_1_2' },
                                    { text: '3-4', callback_data: 'dice_game_bet_on_3_4' },
                                    { text: '5-6', callback_data: 'dice_game_bet_on_5_6' },
                                ],
                                [
                                    { text: `${translate[c].games.dice.odd}`, callback_data: 'dice_game_bet_on_odd' },
                                    { text: `${translate[c].games.dice.even}`, callback_data: 'dice_game_bet_on_even' },
                                ],
                                [
                                    { text: translate[c].games.dice.back, callback_data: 'dice_game_back' },
                                    { text: translate[c].games.dice.throw, callback_data: 'dice_game_play' },
                                ],
                            ]
                        }
                    }
                }
                else if (gamePosition === JSON.stringify(position12)) {
                    result = {
                        reply_markup:
                        {
                            inline_keyboard: [
                                [
                                    { text: `${translate[c].games.dice.bet}: ${b.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },
                                ],
                                [
                                    { text: '1', callback_data: 'dice_game_bet_on_1' },
                                    { text: '2', callback_data: 'dice_game_bet_on_2' },
                                    { text: '3', callback_data: 'dice_game_bet_on_3' },
                                    { text: '4', callback_data: 'dice_game_bet_on_4' },
                                    { text: '5', callback_data: 'dice_game_bet_on_5' },
                                    { text: '6', callback_data: 'dice_game_bet_on_6' },
                                ],
                                [
                                    { text: '1-2 ✅', callback_data: 'foobar' },
                                    { text: '3-4', callback_data: 'dice_game_bet_on_3_4' },
                                    { text: '5-6', callback_data: 'dice_game_bet_on_5_6' },
                                ],
                                [
                                    { text: `${translate[c].games.dice.odd}`, callback_data: 'dice_game_bet_on_odd' },
                                    { text: `${translate[c].games.dice.even}`, callback_data: 'dice_game_bet_on_even' },
                                ],
                                [
                                    { text: translate[c].games.dice.back, callback_data: 'dice_game_back' },
                                    { text: translate[c].games.dice.throw, callback_data: 'dice_game_play' },
                                ],
                            ]
                        }
                    }
                }
                else if (gamePosition === JSON.stringify(position34)) {
                    result = {
                        reply_markup:
                        {
                            inline_keyboard: [
                                [
                                    { text: `${translate[c].games.dice.bet}: ${b.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },
                                ],
                                [
                                    { text: '1', callback_data: 'dice_game_bet_on_1' },
                                    { text: '2', callback_data: 'dice_game_bet_on_2' },
                                    { text: '3', callback_data: 'dice_game_bet_on_3' },
                                    { text: '4', callback_data: 'dice_game_bet_on_4' },
                                    { text: '5', callback_data: 'dice_game_bet_on_5' },
                                    { text: '6', callback_data: 'dice_game_bet_on_6' },
                                ],
                                [
                                    { text: '1-2', callback_data: 'dice_game_bet_on_1_2' },
                                    { text: '3-4 ✅', callback_data: 'foobar' },
                                    { text: '5-6', callback_data: 'dice_game_bet_on_5_6' },
                                ],
                                [
                                    { text: `${translate[c].games.dice.odd}`, callback_data: 'dice_game_bet_on_odd' },
                                    { text: `${translate[c].games.dice.even}`, callback_data: 'dice_game_bet_on_even' },
                                ],
                                [
                                    { text: translate[c].games.dice.back, callback_data: 'dice_game_back' },
                                    { text: translate[c].games.dice.throw, callback_data: 'dice_game_play' },
                                ],
                            ]
                        }
                    }
                }
                else if (gamePosition === JSON.stringify(position56)) {
                    result = {
                        reply_markup:
                        {
                            inline_keyboard: [
                                [
                                    { text: `${translate[c].games.dice.bet}: ${b.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },
                                ],
                                [
                                    { text: '1', callback_data: 'dice_game_bet_on_1' },
                                    { text: '2', callback_data: 'dice_game_bet_on_2' },
                                    { text: '3', callback_data: 'dice_game_bet_on_3' },
                                    { text: '4', callback_data: 'dice_game_bet_on_4' },
                                    { text: '5', callback_data: 'dice_game_bet_on_5' },
                                    { text: '6', callback_data: 'dice_game_bet_on_6' },
                                ],
                                [
                                    { text: '1-2', callback_data: 'dice_game_bet_on_1_2' },
                                    { text: '3-4', callback_data: 'dice_game_bet_on_3_4' },
                                    { text: '5-6 ✅', callback_data: 'foobar' },
                                ],
                                [
                                    { text: `${translate[c].games.dice.odd}`, callback_data: 'dice_game_bet_on_odd' },
                                    { text: `${translate[c].games.dice.even}`, callback_data: 'dice_game_bet_on_even' },
                                ],
                                [
                                    { text: translate[c].games.dice.back, callback_data: 'dice_game_back' },
                                    { text: translate[c].games.dice.throw, callback_data: 'dice_game_play' },
                                ],
                            ]
                        }
                    }
                }
                else if (gamePosition === JSON.stringify(positionOdd)) {
                    result = {
                        reply_markup:
                        {
                            inline_keyboard: [
                                [
                                    { text: `${translate[c].games.dice.bet}: ${b.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },
                                ],
                                [
                                    { text: '1', callback_data: 'dice_game_bet_on_1' },
                                    { text: '2', callback_data: 'dice_game_bet_on_2' },
                                    { text: '3', callback_data: 'dice_game_bet_on_3' },
                                    { text: '4', callback_data: 'dice_game_bet_on_4' },
                                    { text: '5', callback_data: 'dice_game_bet_on_5' },
                                    { text: '6', callback_data: 'dice_game_bet_on_6' },
                                ],
                                [
                                    { text: '1-2', callback_data: 'dice_game_bet_on_1_2' },
                                    { text: '3-4', callback_data: 'dice_game_bet_on_3_4' },
                                    { text: '5-6', callback_data: 'dice_game_bet_on_5_6' },
                                ],
                                [
                                    { text: `${translate[c].games.dice.odd} ✅`, callback_data: 'foobar' },
                                    { text: `${translate[c].games.dice.even}`, callback_data: 'dice_game_bet_on_even' },
                                ],
                                [
                                    { text: translate[c].games.dice.back, callback_data: 'dice_game_back' },
                                    { text: translate[c].games.dice.throw, callback_data: 'dice_game_play' },
                                ],
                            ]
                        }
                    }
                }
                else if (gamePosition === JSON.stringify(positionEven)) {
                    result = {
                        reply_markup:
                        {
                            inline_keyboard: [
                                [
                                    { text: `${translate[c].games.dice.bet}: ${b.game_info.dice_bet} $`, callback_data: 'dice_game_bet_value_' },
                                ],
                                [
                                    { text: '1', callback_data: 'dice_game_bet_on_1' },
                                    { text: '2', callback_data: 'dice_game_bet_on_2' },
                                    { text: '3', callback_data: 'dice_game_bet_on_3' },
                                    { text: '4', callback_data: 'dice_game_bet_on_4' },
                                    { text: '5', callback_data: 'dice_game_bet_on_5' },
                                    { text: '6', callback_data: 'dice_game_bet_on_6' },
                                ],
                                [
                                    { text: '1-2', callback_data: 'dice_game_bet_on_1_2' },
                                    { text: '3-4', callback_data: 'dice_game_bet_on_3_4' },
                                    { text: '5-6', callback_data: 'dice_game_bet_on_5_6' },
                                ],
                                [
                                    { text: `${translate[c].games.dice.odd}`, callback_data: 'dice_game_bet_on_odd' },
                                    { text: `${translate[c].games.dice.even} ✅`, callback_data: 'foobar' },
                                ],
                                [
                                    { text: translate[c].games.dice.back, callback_data: 'dice_game_back' },
                                    { text: translate[c].games.dice.throw, callback_data: 'dice_game_play' },
                                ],
                            ]
                        }
                    }
                }
                return result;
            }

            bot.editMessageText('...', {
                chat_id: chatId,
                message_id: messageId,
            });
            // iceGameMessage(languageState)
            const reply_markupOtions__RESULT = await reply_markupOtions(user, languageState);
            const diceGameMessage__RESULT = await diceGameMessage(languageState)
            await bot.sendDice(chatId, { emoji })
                .then(async (response) => {
                    const diceValue = response.dice.value;
                    const dice_game_position = JSON.stringify(user.game_info.dice_game_position);
                    if (dice_game_position.includes(diceValue)) {
                        if (dice_game_position === JSON.stringify(position1) || dice_game_position === JSON.stringify(position2) || dice_game_position === JSON.stringify(position3) || dice_game_position === JSON.stringify(position4) || dice_game_position === JSON.stringify(position5) || dice_game_position === JSON.stringify(position6)) {
                            bot.editMessageText('x5', {
                                chat_id: chatId,
                                message_id: messageId,
                            });
                            diceWinBet = user.game_info.dice_bet * 5


                            diceWinBet = parseToNum(diceWinBet)

                            user.profile.balance = user.profile.balance - user.game_info.dice_bet
                            user.profile.balance = user.profile.balance + diceWinBet
                            user.profile.balance = parseToNum(user.profile.balance)

                            user.balance.m_spend = user.balance.m_spend + user.game_info.dice_bet
                            user.balance.m_spend = parseToNum(user.balance.m_spend)

                            user.game_info.dice_game_win = user.game_info.dice_game_win + diceWinBet
                            user.game_info.dice_game_win = parseToNum(user.game_info.dice_game_win)
                            user.game_info.dice_game_loss = user.game_info.dice_game_loss + user.game_info.dice_bet
                            user.game_info.dice_game_loss = parseToNum(user.game_info.dice_game_loss)

                            if (user.referral_info.referral_who_invited_id != '') {
                                referralUser.referral_info.referral_balance.balance_earned = referralUser.referral_info.referral_balance.balance_earned + user.game_info.dice_bet
                                referralUser.referral_info.referral_balance.balance_earned = parseToNum(referralUser.referral_info.referral_balance.balance_earned)
                                referralUser.save()
                            }

                            user.balance.spend = user.balance.spend + user.game_info.dice_bet
                            user.balance.spend = parseFloat(user.balance.spend)
                            user.game_info.dice_game_played += 1
                            user.save()

                        }
                        else if (dice_game_position === JSON.stringify(position12) || dice_game_position === JSON.stringify(position34) || dice_game_position === JSON.stringify(position56)) {
                            bot.editMessageText('x2.7', {
                                chat_id: chatId,
                                message_id: messageId,
                            });
                            diceWinBet = user.game_info.dice_bet * 2.7


                            diceWinBet = parseToNum(diceWinBet)

                            user.profile.balance = user.profile.balance - user.game_info.dice_bet
                            user.profile.balance = user.profile.balance + diceWinBet
                            user.profile.balance = parseToNum(user.profile.balance)

                            user.balance.m_spend = user.balance.m_spend + user.game_info.dice_bet
                            user.balance.m_spend = parseToNum(user.balance.m_spend)

                            user.game_info.dice_game_win = user.game_info.dice_game_win + diceWinBet
                            user.game_info.dice_game_win = parseToNum(user.game_info.dice_game_win)
                            user.game_info.dice_game_loss = user.game_info.dice_game_loss + user.game_info.dice_bet
                            user.game_info.dice_game_loss = parseToNum(user.game_info.dice_game_loss)

                            if (user.referral_info.referral_who_invited_id != '') {
                                referralUser.referral_info.referral_balance.balance_earned = referralUser.referral_info.referral_balance.balance_earned + user.game_info.dice_bet
                                referralUser.referral_info.referral_balance.balance_earned = parseToNum(referralUser.referral_info.referral_balance.balance_earned)
                                referralUser.save()
                            }

                            user.balance.spend = user.balance.spend + user.game_info.dice_bet
                            user.balance.spend = parseInt(user.balance.spend)
                            user.game_info.dice_game_played += 1
                            user.save()

                        }
                        else if (dice_game_position === JSON.stringify(positionOdd) || dice_game_position === JSON.stringify(positionEven)) {
                            bot.editMessageText('x0.8', {
                                chat_id: chatId,
                                message_id: messageId,
                            });
                            diceWinBet = user.game_info.dice_bet * 0.8


                            diceWinBet = parseToNum(diceWinBet)

                            user.profile.balance = user.profile.balance - user.game_info.dice_bet
                            user.profile.balance = user.profile.balance + diceWinBet
                            user.profile.balance = parseToNum(user.profile.balance)

                            user.balance.m_spend = user.balance.m_spend + user.game_info.dice_bet
                            user.balance.m_spend = parseToNum(user.balance.m_spend)

                            user.game_info.dice_game_win = user.game_info.dice_game_win + diceWinBet
                            user.game_info.dice_game_win = parseToNum(user.game_info.dice_game_win)
                            user.game_info.dice_game_loss = user.game_info.dice_game_loss + user.game_info.dice_bet
                            user.game_info.dice_game_loss = parseToNum(user.game_info.dice_game_loss)

                            if (user.referral_info.referral_who_invited_id != '') {
                                referralUser.referral_info.referral_balance.balance_earned = referralUser.referral_info.referral_balance.balance_earned + user.game_info.dice_bet
                                referralUser.referral_info.referral_balance.balance_earned = parseToNum(referralUser.referral_info.referral_balance.balance_earned)
                                referralUser.save()
                            }

                            user.balance.spend = user.balance.spend + user.game_info.dice_bet
                            user.balance.spend = parseInt(user.balance.spend)
                            user.game_info.dice_game_played += 1
                            user.save()


                        }
                        await bot.sendMessage(chatId, diceGameMessage(languageState), reply_markupOtions__RESULT)
                    }
                    else {
                        bot.editMessageText('[No win]', {
                            chat_id: chatId,
                            message_id: messageId,
                        });


                        user.profile.balance = user.profile.balance - user.game_info.dice_bet
                        user.profile.balance = parseToNum(user.profile.balance)

                        user.balance.m_spend = user.balance.m_spend + user.game_info.dice_bet
                        user.balance.m_spend = parseToNum(user.balance.m_spend)

                        user.game_info.dice_game_win = user.game_info.dice_game_win + diceWinBet
                        user.game_info.dice_game_win = parseToNum(user.game_info.dice_game_win)
                        user.game_info.dice_game_loss = user.game_info.dice_game_loss + user.game_info.dice_bet
                        user.game_info.dice_game_loss = parseToNum(user.game_info.dice_game_loss)

                        if (user.referral_info.referral_who_invited_id != '') {
                            referralUser.referral_info.referral_balance.balance_earned = referralUser.referral_info.referral_balance.balance_earned + user.game_info.dice_bet
                            referralUser.referral_info.referral_balance.balance_earned = parseToNum(referralUser.referral_info.referral_balance.balance_earned)
                            referralUser.save()
                        }

                        user.balance.spend = user.balance.spend + user.game_info.dice_bet
                        user.balance.spend = parseFloat(user.balance.spend)
                        user.game_info.dice_game_played += 1
                        user.save()
                        await bot.sendMessage(chatId, diceGameMessage(languageState), reply_markupOtions__RESULT)
                    }
                })
                .catch((error) => {
                    console.error('Ошибка при отправке анимированного эмодзи:', error);
                });
        }
    }
    else if (query.data === "dice_st") {
        bot.editMessageText(boneGameAbout(languageState), {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: boneGameOptions(languageState).reply_markup,
        })
    }
    else if (query.data === "game_bone_creating") {



        bone_game.game_status = 'creating';
        // const user.game_info.bone_game.game_bet = bone_game.game_bet;
        user.save()
        bot.editMessageText(boneGameAbout(languageState), {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: boneGameOptionsCreating(languageState, user.game_info.bone_game.game_bet).reply_markup,
        })

    }
    else if (query.data === "bone_game_back") {
        const bone_game = user.game_info.bone_game

        bone_game.room_id = '';
        bone_game.opponent_id = '';
        bone_game.game_status = ''
        user.save()
        bot.editMessageText(boneGameAbout(languageState), {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: boneGameOptions(languageState).reply_markup,
        })

    }
    else if (query.data === "game_bone_create") {
        const chatId = query.message.chat.id;
        const messageId = query.message.message_id;

        const waitingMessage = (languageState) => {
            return `${translate[languageState].games.dice.versus.waiting_for_opponent}`
        }

        user.game_info.bone_game.room_id = chatId;
        user.game_info.bone_game.game_status = 'created'
        user.save()


        bot.sendMessage(chatId, waitingMessage(languageState), {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [{ text: translate[languageState].games.dice.versus.return, callback_data: 'bone_game_back' },],
                ]
            },
        })

        // user.game_info.bone_game.game_status

    }
    else if (query.data === 'bone_game_set_bet') {
        if (user.profile.balance < 0.1) {
            bot.sendMessage("[**Low balance", deleteMessage);
        }
        else {
            await bot.editMessageText(setBetMessage(languageState), {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '-', callback_data: 'versus_game_minus' },
                            { text: betButton(user.game_info.bone_game.game_bet), callback_data: 'versus_game________' },
                            { text: '+', callback_data: 'versus_game_plus' },
                        ],
                        [

                            { text: translate[languageState].games.slots.min, callback_data: 'versus_game_min' },
                            { text: translate[languageState].games.slots.double, callback_data: 'versus_game_double' },
                            { text: translate[languageState].games.slots.max, callback_data: 'versus_game_max' },
                        ],
                        [

                            { text: translate[languageState].games.slots.slot_game_back, callback_data: 'versus_game_back' },
                        ],
                    ],
                },
            });
        };
    }
    else if (query.data === 'versus_game_minus') {
        console.log('minus')
        switch (user.game_info.bone_game.game_bet) {
            case game_bet = 0.1:
                await bot.editMessageText(setBetMessage(languageState), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '-', callback_data: 'foobar' },
                                { text: betButton(user.game_info.bone_game.game_bet), callback_data: 'dice_bet_____' },
                                { text: '+', callback_data: 'versus_game_plus' },
                            ],
                            [

                                { text: translate[languageState].games.slots.min, callback_data: 'versus_game_min' },
                                { text: translate[languageState].games.slots.double, callback_data: 'versus_game_double' },
                                { text: translate[languageState].games.slots.max, callback_data: 'versus_game_max' },
                            ],
                            [

                                { text: translate[languageState].games.slots.slot_game_back, callback_data: 'versus_game_back' },
                            ],
                        ],
                    },
                });
                break;
            default:
                newBetVersus = user.game_info.bone_game.game_bet
                newBetVersus = newBetVersus - 0.1
                newBetVersus = parseFloat(newBetVersus)
                newBetVersus = newBetVersus.toFixed(2)
                user.game_info.bone_game.game_bet = parseFloat(newBetVersus)
                user.save()
                console.log(user)
                console.log(user.game_info.bone_game.game_bet, newBetVersus)
                await bot.editMessageText(setBetMessage(languageState), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '-', callback_data: 'versus_game_minus' },
                                { text: betButton(user.game_info.bone_game.game_bet), callback_data: 'dice_bet_____' },
                                { text: '+', callback_data: 'versus_game_plus' },
                            ],
                            [

                                { text: translate[languageState].games.slots.min, callback_data: 'versus_game_min' },
                                { text: translate[languageState].games.slots.double, callback_data: 'versus_game_double' },
                                { text: translate[languageState].games.slots.max, callback_data: 'versus_game_max' },
                            ],
                            [

                                { text: translate[languageState].games.slots.slot_game_back, callback_data: 'versus_game_back' },
                            ],
                        ],
                    },
                });
                break;
        };
    }
    else if (query.data === 'versus_game_plus') {
        switch (user.game_info.bone_game.game_bet) {
            case game_bet = 100:
                await bot.editMessageText(setBetMessage(languageState), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '-', callback_data: 'versus_game_minus' },
                                { text: betButton(user.game_info.bone_game.game_bet), callback_data: 'dice_bet_____' },
                                { text: '+', callback_data: 'foobar' },
                            ],
                            [

                                { text: translate[languageState].games.slots.min, callback_data: 'versus_game_min' },
                                { text: translate[languageState].games.slots.double, callback_data: 'versus_game_double' },
                                { text: translate[languageState].games.slots.max, callback_data: 'versus_game_max' },
                            ],
                            [

                                { text: translate[languageState].games.slots.slot_game_back, callback_data: 'versus_game_back' },
                            ],
                        ],
                    },
                });
                break;
            default:
                newBetVersus = user.game_info.bone_game.game_bet
                newBetVersus = newBetVersus + 0.1
                newBetVersus = parseFloat(newBetVersus)
                newBetVersus = newBetVersus.toFixed(2)
                user.game_info.bone_game.game_bet = parseFloat(newBetVersus)
                user.save()
                console.log(user)
                console.log(user.game_info.bone_game.game_bet, newBetVersus)
                await bot.editMessageText(setBetMessage(languageState), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '-', callback_data: 'versus_game_minus' },
                                { text: betButton(user.game_info.bone_game.game_bet), callback_data: 'versus_game________' },
                                { text: '+', callback_data: 'versus_game_plus' },
                            ],
                            [

                                { text: translate[languageState].games.slots.min, callback_data: 'versus_game_min' },
                                { text: translate[languageState].games.slots.double, callback_data: 'versus_game_double' },
                                { text: translate[languageState].games.slots.max, callback_data: 'versus_game_max' },
                            ],
                            [

                                { text: translate[languageState].games.slots.slot_game_back, callback_data: 'versus_game_back' },
                            ],
                        ],
                    },
                });
                break;
        };
    }
    else if (query.data === 'versus_game_min') {
        switch (user.game_info.bone_game.game_bet) {
            case game_bet = 0.1:
                await bot.editMessageText(setBetMessage(languageState), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '-', callback_data: 'versus_game_minus' },
                                { text: betButton(user.game_info.bone_game.game_bet), callback_data: 'versus_game________' },
                                { text: '+', callback_data: 'versus_game_plus' },
                            ],
                            [

                                { text: translate[languageState].games.slots.min, callback_data: 'foobar' },
                                { text: translate[languageState].games.slots.double, callback_data: 'versus_game_double' },
                                { text: translate[languageState].games.slots.max, callback_data: 'versus_game_max' },
                            ],
                            [

                                { text: translate[languageState].games.slots.slot_game_back, callback_data: 'versus_game_back' },
                            ],
                        ],
                    },
                });
                break;
            default:
                newBetVersus = user.game_info.bone_game.game_bet
                newBetVersus = 0.1
                newBetVersus = parseFloat(newBetVersus)
                newBetVersus = newBetVersus.toFixed(2)
                user.game_info.bone_game.game_bet = parseFloat(newBetVersus)
                user.save()
                console.log(user)
                console.log(user.game_info.bone_game.game_bet, newBetVersus)
                await bot.editMessageText(setBetMessage(languageState), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '-', callback_data: 'versus_game_minus' },
                                { text: betButton(user.game_info.bone_game.game_bet), callback_data: 'versus_game________' },
                                { text: '+', callback_data: 'versus_game_plus' },
                            ],
                            [

                                { text: translate[languageState].games.slots.min, callback_data: 'versus_game_min' },
                                { text: translate[languageState].games.slots.double, callback_data: 'versus_game_double' },
                                { text: translate[languageState].games.slots.max, callback_data: 'versus_game_max' },
                            ],
                            [

                                { text: translate[languageState].games.slots.slot_game_back, callback_data: 'versus_game_back' },
                            ],
                        ],
                    },
                });
                break;
        };
    }
    else if (query.data === 'versus_game_double') {
        if (user.game_info.bone_game.game_bet > 50) {
            await bot.editMessageText(setBetMessage(languageState), {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '-', callback_data: 'versus_game_minus' },
                            { text: betButton(user.game_info.bone_game.game_bet), callback_data: 'versus_game________' },
                            { text: '+', callback_data: 'versus_game_plus' },
                        ],
                        [

                            { text: translate[languageState].games.slots.min, callback_data: 'versus_game_min' },
                            { text: translate[languageState].games.slots.double, callback_data: 'foobar' },
                            { text: translate[languageState].games.slots.max, callback_data: 'versus_game_max' },
                        ],
                        [

                            { text: translate[languageState].games.slots.slot_game_back, callback_data: 'versus_game_back' },
                        ],
                    ],
                },
            });
        }
        else {
            console.log(user)
            newBetVersus = user.game_info.bone_game.game_bet
            newBetVersus = newBetVersus * 2
            newBetVersus = parseFloat(newBetVersus)
            newBetVersus = newBetVersus.toFixed(2)
            user.game_info.bone_game.game_bet = parseFloat(newBetVersus)
            user.save()
            console.log(user)
            console.log(user.game_info.bone_game.game_bet, newBetVersus)
            await bot.editMessageText(setBetMessage(languageState), {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '-', callback_data: 'versus_game_minus' },
                            { text: betButton(user.game_info.bone_game.game_bet), callback_data: 'versus_game________' },
                            { text: '+', callback_data: 'versus_game_plus' },
                        ],
                        [

                            { text: translate[languageState].games.slots.min, callback_data: 'versus_game_min' },
                            { text: translate[languageState].games.slots.double, callback_data: 'versus_game_double' },
                            { text: translate[languageState].games.slots.max, callback_data: 'versus_game_max' },
                        ],
                        [

                            { text: translate[languageState].games.slots.slot_game_back, callback_data: 'versus_game_back' },
                        ],
                    ],
                },
            });
        }

    }
    else if (query.data === 'versus_game_max') {
        switch (user.game_info.bone_game.game_bet) {
            case game_bet = 100:
                await bot.editMessageText(setBetMessage(languageState), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '-', callback_data: 'versus_game_minus' },
                                { text: betButton(user.game_info.bone_game.game_bet), callback_data: 'versus_game________' },
                                { text: '+', callback_data: 'versus_game_plus' },
                            ],
                            [

                                { text: translate[languageState].games.slots.min, callback_data: 'versus_game_min' },
                                { text: translate[languageState].games.slots.double, callback_data: 'versus_game_double' },
                                { text: translate[languageState].games.slots.max, callback_data: 'foobar' },
                            ],
                            [

                                { text: translate[languageState].games.slots.slot_game_back, callback_data: 'versus_game_back' },
                            ],
                        ],
                    },
                });
                break;
            default:
                newBetVersus = user.game_info.bone_game.game_bet
                newBetVersus = 100
                newBetVersus = parseFloat(newBetVersus)
                newBetVersus = newBetVersus.toFixed(2)
                user.game_info.bone_game.game_bet = parseFloat(newBetVersus)
                user.save()
                console.log(user)
                console.log(user.game_info.bone_game.game_bet, newBetVersus)
                await bot.editMessageText(setBetMessage(languageState), {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '-', callback_data: 'versus_game_minus' },
                                { text: betButton(user.game_info.bone_game.game_bet), callback_data: 'slot_game_____' },
                                { text: '+', callback_data: 'versus_game_plus' },
                            ],
                            [

                                { text: translate[languageState].games.slots.min, callback_data: 'versus_game_min' },
                                { text: translate[languageState].games.slots.double, callback_data: 'versus_game_double' },
                                { text: translate[languageState].games.slots.max, callback_data: 'versus_game_max' },
                            ],
                            [

                                { text: translate[languageState].games.slots.slot_game_back, callback_data: 'versus_game_back' },
                            ],
                        ],
                    },
                });
                break;
        };
    }
    // dice bet config
    else if (query.data === 'versus_game_back') {
        const chatId = query.from.id

        bot.editMessageText(boneGameAbout(languageState), {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: boneGameOptionsCreating(languageState, user.game_info.bone_game.game_bet).reply_markup
        });
        
        
    }
    else if (query.data === 'game_bone_searching') {

        const openGameMessage = (languageState) => {
            return `${translate[languageState].games.dice.versus.search_msg}`
        }

        const openGameOptions = (languageState) => {
            return {
                reply_markup: {
                    inline_keyboard: [
                        ...allGames.map((item) =>
                            [
                                {
                                    text: `${item.game_info.bone_game.room_id} - ${item.game_info.bone_game.game_bet} $`,
                                    callback_data: `${item.game_info.bone_game.room_id}`
                                },
                            ],
                        ),

                        [
                            { text: translate[languageState].wallet.back, callback_data: 'bone_game_back' },
                        ],
                    ]
                }
            }
        }

        const bruhFace = await openGameOptions(languageState);

        console.log(gamesArrayForQuery)
        console.log(bruhFace.reply_markup.inline_keyboard[0][0])

        bot.sendMessage(chatId, openGameMessage(languageState), openGameOptions(languageState));

    }
    else if (gamesArrayForQuery.includes(query.data)) {
        const chatId = query.from.id;
        const messageId = query.message.message_id;

        const gameToJoin = await allUsers.findOne({ "game_info.bone_game.room_id": query.data });

        gameToJoin.game_info.bone_game.opponent_id = chatId;
        gameToJoin.game_info.bone_game.game_status = 'connected';
        gameToJoin.save();

        bot.sendMessage(chatId, `${translate[languageState].games.dice.versus.search_msg_found} : ${gameToJoin.game_info.bone_game.game_bet} $`, boneGameOptionThrow(languageState))
        bot.sendMessage(gameToJoin.game_info.bone_game.room_id, `${translate[languageState].games.dice.versus.search_msg_found}\n${gameToJoin.game_info.bone_game.game_bet} $`, boneGameOptionThrow(languageState))


    }
    else if (query.data === 'bone_game_throw') {
        const chatId = query.from.id;
        const messageId = query.message.message_id;

        const emoji = '🎲';

        let firstPlayerFoo = 0
        let secondPlayerBar = 0

    await bot.sendDice(chatId, { emoji })
        .then(async (response)=> {
            const userIdWhoThrow = response.chat.id;


            const thisGameOwner = await allUsers.findOne({ "game_info.bone_game.room_id": userIdWhoThrow });

            const thisGameOpponent = await allUsers.findOne({ "game_info.bone_game.opponent_id": userIdWhoThrow });

            if (thisGameOwner) {
                if (thisGameOwner.game_info.bone_game.owner_throw != 0) {
                    bot.sendMessage(thisGameOwner.game_info.bone_game.room_id, `Вы уже бросили`, deleteMessage);
                } 
                else {
                    thisGameOwner.game_info.bone_game.owner_throw = response.dice.value;
                    await thisGameOwner.save();

                    bot.sendMessage(thisGameOwner.game_info.bone_game.opponent_id, `Противник сделал бросок`);
                    firstPlayerFoo = true;
                }
            } else if (thisGameOpponent) {
                if (thisGameOpponent.game_info.bone_game.opponent_throw != 0) {

                    console.log(response);
                    bot.sendMessage(thisGameOpponent.game_info.bone_game.opponent_id, `Вы уже бросили`, deleteMessage);
                } 
                else {
                    thisGameOpponent.game_info.bone_game.opponent_throw = response.dice.value;
                    await thisGameOpponent.save();

                    bot.sendMessage(thisGameOpponent.game_info.bone_game.room_id, `Противник сделал бросок`);
                    secondPlayerBar = true
                }
            } 
            return response;
        })
        .then( async (response) => {
            const thisId = response.chat.id;
            const thisGame = await allUsers.findOne({
                $or: [
                    { "game_info.bone_game.room_id": thisId },
                    { "game_info.bone_game.opponent_id": thisId },
                ],
            });

            if ( thisGame.game_info.bone_game.owner_throw !=0 && thisGame.game_info.bone_game.opponent_throw != 0 ) {

                let boneWinBet;

                const ownerUser = await allUsers.findOne({ id: thisGame.game_info.bone_game.room_id });
                const opponentUser = await allUsers.findOne( { id : thisGame.game_info.bone_game.opponent_id } );
                console.log('game is on');

                let winner;

                if (thisGame.game_info.bone_game.owner_throw > thisGame.game_info.bone_game.opponent_throw) {
                    winner = thisGame.game_info.bone_game.room_id;

                    thisGame.game_info.bone_game.owner_throw = 0;
                    thisGame.game_info.bone_game.opponent_throw = 0;

                    boneWinBet = ownerUser.game_info.bone_game.game_bet

                    thisGame.profile.balance = parseFloat(thisGame.profile.balance)
                    thisGame.profile.balance = thisGame.profile.balance + thisGame.game_info.bone_game.game_bet
                    thisGame.profile.balance = parseFloat(thisGame.profile.balance)




                    opponentUser.profile.balance = parseFloat(opponentUser.profile.balance)
                    opponentUser.profile.balance = opponentUser.profile.balance - thisGame.game_info.bone_game.game_bet;
                    opponentUser.profile.balance = parseFloat(opponentUser.profile.balance)
                    opponentUser.save()

                    bot.sendMessage(opponentUser.id, `winner is ${winner}\nваш баланс: ${opponentUser.profile.balance}$ - ${boneWinBet}$`, boneGameOptionThrow(languageState) );
                    bot.sendMessage(thisGame.id, `winner is ${winner}\nваш баланс: ${thisGame.profile.balance}$ + ${boneWinBet}$`, boneGameOptionThrow(languageState) );

                    boneWinBet = 0

                    thisGame.game_info.bone_game.owner_throw = 0
                    thisGame.game_info.bone_game.opponent_throw = 0
                    thisGame.save()

                } else if ( thisGame.game_info.bone_game.owner_throw < thisGame.game_info.bone_game.opponent_throw) {


                    winner = thisGame.game_info.bone_game.opponent_id;

                    boneWinBet = ownerUser.game_info.bone_game.game_bet

                    opponentUser.profile.balance = parseFloat(opponentUser.profile.balance)
                    opponentUser.profile.balance = opponentUser.profile.balance + thisGame.game_info.bone_game.game_bet
                    opponentUser.profile.balance = parseFloat(opponentUser.profile.balance)
                    opponentUser.save()

                    thisGame.profile.balance = parseFloat(thisGame.profile.balance)
                    thisGame.profile.balance = thisGame.profile.balance - thisGame.game_info.bone_game.game_bet;
                    thisGame.profile.balance = parseFloat(thisGame.profile.balance)

                    bot.sendMessage(opponentUser.id, `winner is ${winner}\b ваш баланс: ${opponentUser.profile.balance}$ + ${boneWinBet}$`, boneGameOptionThrow(languageState) );
                    bot.sendMessage(thisGame.id, `winner is ${winner}\nваш баланс: ${thisGame.profile.balance}$ - ${boneWinBet}$`, boneGameOptionThrow(languageState) );

                    boneWinBet = 0

                    thisGame.game_info.bone_game.owner_throw = 0
                    thisGame.game_info.bone_game.opponent_throw = 0
                    thisGame.save()
                } else if ( thisGame.game_info.bone_game.owner_throw === thisGame.game_info.bone_game.opponent_throw ) {

                    

                    bot.sendMessage(thisGame.game_info.bone_game.opponent_id, `Ничья!\n ваш баланс: ${opponentUser.profile.balance}$ + 0$`, boneGameOptionThrow(languageState) );
                    bot.sendMessage(thisGame.id, `Ничья!\n ${thisGame.profile.balance}$ + 0$`, boneGameOptionThrow(languageState) );
                
                
                    thisGame.game_info.bone_game.owner_throw = 0
                    thisGame.game_info.bone_game.opponent_throw = 0
                    thisGame.save()
                }       



            }


        })

    }
    else if (query.data === 'bone_game_exit') {
    const chatId = query.from.id;
    const messageId = query.message.message_id;

    console.log(chatId)

    const thisGame = await allUsers.findOne({ 
        $or: [
            { "game_info.bone_game.room_id": chatId },
            { "game_info.bone_game.opponent_id": chatId },
          ],
    });
    //  const thisGame = await  allUsers.findOne({"game_info.bone_game.room_id": chatId  })
    console.log(thisGame)
    
    await bot.sendMessage(thisGame.game_info.bone_game.opponent_id, 'Игра окончена', boneGameOptions(languageState))
    
    await bot.sendMessage(thisGame.game_info.bone_game.room_id, 'Игра окончена', boneGameOptions(languageState))
    

    thisGame.game_info.bone_game.owner_throw = 0;
    thisGame.game_info.bone_game.opponent_throw = 0;
    thisGame.game_info.bone_game.room_id = '';
    thisGame.game_info.bone_game.opponent_id = '';
    thisGame.game_info.bone_game.game_status = '';
    thisGame.save();
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
    } else if (query.data === 'settingsToEn') {
        await switchToEn()
        await bot.editMessageText(translate[languageState].settings.options, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: settingsOptions(languageState).reply_markup,
        });
    }
});
// ADMIN
// admin array
const admins = ['@@@'];
bot.on('callback_query', async (query) => {
    // promocodes
    const promocodes = "";

    const chatId = query.from.id;
    const messageId = query.message.message_id;

    // promocodeLogic
    // promocode create 5 promos

    if (query.data === "admin_promocodes") {
        bot.editMessageText("Тут вы можете сгенерировать промокоды которые будут работать 24 часа", {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: promocodeOption.reply_markup,
        });
    }

    else if (query.data === "delete_message") {
        bot.deleteMessage(chatId, messageId);
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
                code: promo10, value: 10, status: 'active', date: { creation: new Date(), expire: new Date(Date.now() + 24 * 60 * 60 * 1000), }, used_by: '',
                used_by_id: '',
            },
            {
                code: promo20, value: 20, status: 'active', date: { creation: new Date(), expire: new Date(Date.now() + 24 * 60 * 60 * 1000), }, used_by: '',
                used_by_id: '',
            },
            {
                code: promo30, value: 30, status: 'active', date: { creation: new Date(), expire: new Date(Date.now() + 24 * 60 * 60 * 1000), }, used_by: '',
                used_by_id: '',
            },
            {
                code: promo40, value: 40, status: 'active', date: { creation: new Date(), expire: new Date(Date.now() + 24 * 60 * 60 * 1000), }, used_by: '',
                used_by_id: '',
            },
            {
                code: promo50, value: 50, status: 'active', date: { creation: new Date(), expire: new Date(Date.now() + 24 * 60 * 60 * 1000), }, used_by: '',
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

                if (message.chat.id === chatId) {

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

            }
        });
    };
});
//  get all promocodes
bot.on('callback_query', async (query) => {
    if (query.data === "admin_promocodes_get_all") {
        chatId = query.from.id;
        const allPromocodes = await promocodes.find({});
        const allPromoMessage = allPromocodes.map(data => data.code + ' \n' + data.status + '\n').join('\n');
        bot.sendMessage(chatId, `Все промокоды\nЦифры в конце указывают на % к пополнению:\n${allPromoMessage}`, deleteMessage);
    }
});

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
});
cron.schedule('0 0 1 * *', async () => {
    // Получаем текущую дату
    const currentDate = new Date();

    // Обновляем значение `balance.m_spend` для всех пользователей
    const usersToUpdate = await allUsers.find({});
    for (const user of usersToUpdate) {
        user.balance.m_spend = 0;
        await user.save();
    }

    console.log('Значение balance.m_spend обновлено для всех пользователей');
});

// Listen on the 'polling_error' event
bot.on('polling_error', (error) => {
    var time = new Date();
    console.log("TIME:", time);
    console.log("CODE:", error.code);  // => 'EFATAL'
    console.log("MSG:", error.message);
    console.log("STACK:", error.stack);
});
