const { languageState } = require("./languages");

module.exports = (translate) => {
    // START
    const startOptions = (languageState) => {
        return {
            reply_markup: {
                inline_keyboard: [
                    [

                        { text: translate[languageState].games.options, callback_data: 'games' },
                    ],
                    [

                        { text: translate[languageState].wallet.option, callback_data: 'wallet' },
                    ],
                    [

                        { text: translate[languageState].referral.option, callback_data: 'referral' },
                    ],
                    [

                        { text: translate[languageState].settings.options, callback_data: 'settings' },
                    ],
                ],
            },
        };
    };
    // SETTINGS
    const settingsOptions = (languageState) => {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: translate[languageState].settings.language, callback_data: 'language_selection' },
                    ],
                    [
                        { text: translate[languageState].settings.back, callback_data: 'settings_back' },
                    ],
                ],
            },
        };
    };
    const languageOptions = (languageState) => {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: translate[languageState].settings.language_options[0], callback_data: 'settingsToEn' },
                        { text: translate[languageState].settings.language_options[1], callback_data: 'settingsToRu' },
                    ],
                    [
                        { text: translate[languageState].settings.back, callback_data: 'language_back' },
                    ],
                ],
            },
        };
    };
    // GAME
    const gamesOptions = (languageState) => {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: translate[languageState].games.game[0], callback_data: 'slots' },
                        { text: translate[languageState].games.game[1], callback_data: 'dice' },
                    ],
                    [
                        { text: translate[languageState].settings.back, callback_data: 'games_back' },
                    ],
                ],
            },
        };
    };
    const slotOptions = (languageState) => {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: translate[languageState].games.slots.slots_play, callback_data: 'slots_play' },

                    ],
                    [
                        { text: translate[languageState].games.slots.back, callback_data: 'slots_back' }
                    ],
                ],
            },
        };
    };
    const slotLowBalance = (languageState) => {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: translate[languageState].wallet.topup, callback_data: 'topUp' },

                    ],
                    [
                        { text: translate[languageState].games.slots.back, callback_data: 'slots_back' }
                    ],
                ],
            },
        };
    };
    const diceOptions = (languageState) => {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: translate[languageState].games.dice.dice_st, callback_data: 'dice_st' },
                        { text: translate[languageState].games.dice.dice_nd, callback_data: 'dice_nd' },
                    ],
                    [
                        { text: translate[languageState].games.dice.back, callback_data: 'dice_back' }
                    ],
                ],
            },
        };
    };
    // SLOTS 
    const slotGameOption = (languageState) => {
        return {
            reply_markup: {
                inline_keyboard: [
                    [

                        { text: '+', callback_data: 'slot_game_minus' },
                        { text: '$$$', callback_data: 'slot_game_' },
                        { text:'-', callback_data: 'slot_game_plus' },
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
        };
    };
    // WALLET
    const walletOptions = (languageState) => {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: translate[languageState].wallet.topup, callback_data: 'topUp' },
                        { text: translate[languageState].wallet.withdrawl, callback_data: 'withdrawl' },

                    ],
                    [{ text: translate[languageState].wallet.help, callback_data: 'help' },],
                    [{ text: translate[languageState].wallet.back, callback_data: 'wallet_back' },],
                ],
            },
        };
    };
    const topUpOptions = (languageState) => {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: translate[languageState].wallet.options[0], callback_data: 'crypto' },
                        { text: translate[languageState].wallet.options[1], callback_data: 'fiat' },

                    ],
                    [{ text: translate[languageState].wallet.help, callback_data: 'help' },],
                    // test
                    [{ text: "+100", callback_data: '+100' },],
                    [{ text: translate[languageState].wallet.back, callback_data: 'topUpBack' },],
                ],
            },
        };
    };
    const makepaymentTEST = (languageState) => {
        return {
            reply_markup: {
                inline_keyboard: [
                  [{ text: 'Pay', pay: true }] // Кнопка оплаты
                ],
              },
        };
    };
    // topup ctypto;
    // const topUpCrypto = (languageState) => {
    //     return {
    //         reply_markup: {
    //             inline_keyboard: [
    //                 [
    //                     { text: translate[languageState].wallet.options[0], callback_data: 'crypto' },
    //                     { text: translate[languageState].wallet.options[1], callback_data: 'fiat' },

    //                 ],
    //                 [{ text: translate[languageState].wallet.help, callback_data: 'help' },],
    //                 [{ text: translate[languageState].wallet.back, callback_data: 'topUpCryptoBack' },],
    //             ]
    //         }
    //     };
    // };
    // const topUpCrypto = (languageState) => {
    //     return {
    //         reply_markup: {
    //             inline_keyboard: [
    //                 [],
    //                 [],
    //                 [],
    //                 [],
    //             ]
    //         }
    //     };
    // };
    // REFERRAL;
    const referralOptions = (languageState)  => {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: translate[languageState].referral.get, callback_data: 'referral_create' },

                    ],
                    [{ text: translate[languageState].referral.profile, callback_data: 'referral_profile' },],
                    [{ text: translate[languageState].wallet.back, callback_data: 'referral_back' },],
                ]
            }
        }
    };
    // REFERRAL BALANCE
    const referralBalanceOptions = (languageState)  => {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: translate[languageState].referral.get, callback_data: 'referral_balance_create' },

                    ],
                    [{ text: translate[languageState].referral.profile, callback_data: 'referral_balance_profile' },],
                    [{ text: translate[languageState].wallet.back, callback_data: 'referral_balance_back' },],
                ]
            }
        }
    };




    return { startOptions, 
        settingsOptions, 
        languageOptions,
        // wallet
         walletOptions,
         topUpOptions,
         makepaymentTEST,
        //  topUpCrypto,
        // slots
        slotLowBalance,
         gamesOptions,
         slotOptions,
         diceOptions,
         slotGameOption,
        // referral
        referralOptions,
        // referral balance
        referralBalanceOptions,

        };
};