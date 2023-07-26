const { languageState } = require("../languages");

module.exports = (translate) => {
    // USER OPTIONS
    // start
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
    // settings
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
    // game
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
    const diceOptionsGame = (languageState) => {
        return {
            reply_markup: {
                    inline_keyboard : [
                        [ { text: translate[languageState].games.dice.dice_st, callback_data: 'dice_game_bet_value_' },],
                        [
                            { text: translate[languageState].games.dice.dice_st, callback_data: 'dice_game_bet_on_1' },
                            { text: translate[languageState].games.dice.dice_st, callback_data: 'dice_game_bet_on_2' },
                            { text: translate[languageState].games.dice.dice_st, callback_data: 'dice_game_bet_on_3' },
                            { text: translate[languageState].games.dice.dice_st, callback_data: 'dice_game_bet_on_4' },
                            { text: translate[languageState].games.dice.dice_st, callback_data: 'dice_game_bet_on_5' },
                            { text: translate[languageState].games.dice.dice_st, callback_data: 'dice_game_bet_on_6' },
                        ],
                        [
                            { text: translate[languageState].games.dice.dice_st, callback_data: 'dice_game_bet_on_1_2' },
                            { text: translate[languageState].games.dice.dice_st, callback_data: 'dice_game_bet_on_3-4' },
                            { text: translate[languageState].games.dice.dice_st, callback_data: 'dice_game_bet_on_5-6' },
                        ],
                        [
                            { text: translate[languageState].games.dice.dice_st, callback_data: 'dice_game_bet_on_even' },
                            { text: translate[languageState].games.dice.dice_st, callback_data: 'dice_game_bet_on_odd' },
                        ],
                        [
                            { text: translate[languageState].games.dice.dice_st, callback_data: 'dice_game_back' },
                            { text: translate[languageState].games.dice.dice_st, callback_data: 'dice_game_play' },
                        ],
                    ]
            },
        };
    };
    // slots 
    const slotGameOption = (languageState) => {
        return {
            reply_markup: {
                inline_keyboard: [
                    [

                        { text: '', callback_data: 'slot_game_minus' },
                        { text: '$$$', callback_data: 'slot_game_' },
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
        };
    };
    // wallet
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
                    [{ text: translate[languageState].wallet.promocode, callback_data: 'promocode' },],
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
    const boneGameOptions = (languageState) => {
        return {
            reply_markup: {
                inline_keyboard: [
                    [{ text: translate[languageState].games.dice.versus.search, callback_data: 'game_bone_searching' }], 
                    [{ text: translate[languageState].games.dice.versus.сreate, callback_data: 'game_bone_creating' }],
                    [{ text: translate[languageState].games.dice.versus.return, callback_data: 'dice_game_back' }] 
                ],
            },
        };
    };
    const boneGameOptionsCreating = (languageState, boneBet) => {
        return {
            reply_markup: {
                inline_keyboard: [
                    [{ text: translate[languageState].games.dice.versus.creating, callback_data: 'game_bone_create' }],
                    [{ text: `${translate[languageState].games.dice.versus.setting_bet} ${boneBet} $`, callback_data: 'bone_game_set_bet' }],
                    [{ text: translate[languageState].games.dice.versus.return, callback_data: 'bone_game_back' }],
                ],
            },
        };
    };
    const boneGameOptionThrow = (languageState) => {
        return {
            reply_markup: {
                inline_keyboard: [
                    [{ text: translate[languageState].games.dice.throw, callback_data: 'bone_game_throw' }],
                    [{ text: translate[languageState].games.dice.versus.return, callback_data: 'bone_game_exit' }],
                ],
            },
        };
    };
    // REFERRAL;
    const referralOptions = (languageState) => {
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
    //referral balance
    const referralBalanceOptions = (languageState) => {
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
    const referralBalanceProfile = (languageState) => {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: translate[languageState].referral.ref_options_profile.withdrawn, callback_data: 'referral_balance_profile_withdrawn' },

                    ],
                    [{ text: translate[languageState].referral.ref_options_profile.back, callback_data: 'referral_balance_profile_back' },],
                ]
            }
        }
    }
    // promocode activation
    const promocodeActivation = (languageState) => {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: translate[languageState].referral.ref_options_profile.withdrawn, callback_data: 'referral_balance_profile_withdrawn' },

                    ],
                    [{ text: translate[languageState].referral.ref_options_profile.back, callback_data: 'referral_balance_profile_back' },],
                ]
            }
        }
    }
    return {
        // USER OPTIONS
        startOptions,
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
        diceOptionsGame,
        slotGameOption,
        // bone game
        boneGameOptions,
        boneGameOptionsCreating,
        boneGameOptionThrow,
        // referral
        referralOptions,
        // referral balance
        referralBalanceOptions,
        referralBalanceProfile,
        // promocode
        promocodeActivation ,

    };
};


