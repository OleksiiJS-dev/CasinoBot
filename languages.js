let languageState = 'ru';

const translate = {
    ru: {
        profile: {
            name: 'Ваше имя',
            balance: 'Ваш баланс',
            balance_cash: 'Нет средств',
            
            
            status: 'Статус',
            status_lvl: ['Новичок', 'Игрок', 'Бронзовый', 'Серебряный', 'Золотой', 'Платина (VIP)'],
            referral: 'Автоматическая реф. ссылка',            
        },
        games: {
            option: 'Игры',
            game: ['Слоты 🎰', 'Кости'],
            back: 'Назад',
            slots: {
                message: '🎰 Крути слоты и выбивай выигрышные комбинации:',
                slots_play : 'Играть',
                back: 'Назад',
                min: 'Мин.',
                max: 'Макс.',
                double: 'Удвоить',
                slot_game_back: 'Назад',
                slot_game_spin: '🔄 Крутить',
                bet_is_too_big: 'Сликом большая ставка',
                bet_is_too_small: 'Слишком маленькая ставка',
                bet_is_too_small: 'Слишком маленькая ставка',
                bet: 'Ставка',
                max_bet: 'Максимальная ставка',
                min_bet: 'Минимальная ставка',
            },
            dice: {
                message: '🎲️ Бросайте кубик и испытайте свою удачу',
                message_game: 'Отправь сумму ставки и выбери исход:',
                dice_message: 'Выберите режим:',
                dice_st: 'Против игрока',
                dice_nd: 'Против диллера',
                back: 'Назад',
                bet: 'Размер ставки',
                throw: 'Бросить 🎲',
                even: 'Четные',
                odd: 'Нечетные',
                versus: {
                    game: 'Создайте или найдите игру',
                    search: 'Поиск',
                    сreate: 'Создание',
                    return: 'Назад',

                    creating: 'Создать',
                    setting_bet: 'Ставка:',
                    place_a_bet: 'Выберите ставку',
                    waiting_for_opponent: 'Ожидайте подключения второго игрока...',
                    search_msg: 'Поиск игры',
                    search_msg_found: 'Опонент подключился',
                    search_msg_found_nd: 'Бросайте кости, ставка',
                },
            },

        },
        wallet: {
            option: 'Кошелек',
            topup: 'Crypto Pay',
            withdrawl: 'Вывод средств',
            payment_msg: 'Введите сумму в ',
            withdrawls_message: 'Сообщение отправлено',
            help: 'Как пополнить?',
            options: ['Крипта', 'Фиат'],
            back: 'Назад',
            topup_back: 'Назад к кошельку',

            fiat_later: 'Будет добавлено позже',

            topup_message_crypto: 'Пожалуйста, выберите валюту',
            topup_message_topup: 'Введите сумму которую хотите пополнить',    
            topup_message_currency: 'Выберите способ пополнения:',

            pay: 'оплатить',

            low_balance: 'На вашем счету должно быть 0.10$ для игры',

            promocode: 'Ввести промокод',
            promocode_activate: 'Введите промокод',
            promocode_activated: 'Промокод активирован',
            promocode_not_activated: 'Промокод не действителен',
            promoused: 'Промокод вы уже использовали',
        },
        referral: {
            option: 'Реферальная ссылка',
            get: 'Создать ссылку',
            profile: 'Профиль',

            balance: 'Вы заработали:',
            ref_link: 'Ваша реферальная ссылка 🔼',
            people_in: 'Приглашено людей:',
            no_referral_link: 'У вас ещё нет реферальной ссылки',
            have_referral_link: 'У вас уже есть реферальная ссылка!',
            
            ref_percentage: 'Уровень реферальной системы',

            ref_options_profile: {
                withdrawn: 'Вывести деньги на баланс',
                back: 'Назад',
            },
        },
        settings: {
            option: 'Настройки',
            language: 'Русский',
            language_options: ['Английский','Русский'],
            back:'Назад',
            language_selection:'Пожалуйста, выберите язык:',
        },
    },
    en: {
        profile: {
            name: 'Name',
            balance: 'Balance',
            balance_cash: 'No money',

            status: 'Status',
            status_lvl: ['Beginner', 'Player', 'Bronze', 'Silver', 'Gold', 'Platinum (VIP)'],

            referral: 'Referral link',

        },
        settings: {
            option: 'Settings',
            language: 'English',
            language_options: ['English', 'Russian'],
            back: 'Back',
            language_selection: 'Please, select a language',
        },
        games: {
            option: 'Games',
            game: ['Slots 🎰', 'Dice'],
            back: 'Back',
            slots: {
                message: '🎰 Spin slots and knock out winning combinations:',
                slots_play : 'Play',
                back: 'Back',
                min: 'Min.',
                max: 'Max.',
                double: 'Double',
                slot_game_back: 'Back',
                slot_game_spin: '🔄 Spin',
                bet_is_too_big: 'Bet is too big!',
                bet_is_too_small: 'Bet is too small!',
                bet: 'Bet',
                max_bet: 'Maximum bet',
                min_bet: 'Mininun bet',
            },
            dice: {
                message: '🎲️ Roll the dice and try your luck',
                message_game: 'Send the bet amount and choose the outcome:',
                dice_message: 'Select mode:',
                dice_st: 'Against the player',
                dice_nd: 'Against the dealer',
                back: 'Back',
                bet: 'Bet amount',
                throw: 'Throw 🎲',
                even: 'Even',
                odd: 'Odd',
                versus: {
                    game: 'Find game',
                    search: 'Searching',
                    сreate: 'Creating',
                    return: 'Return',

                    creating: 'Create',
                    setting_bet: 'Bet is',
                    place_a_bet: 'Place bet',
                    waiting_for_opponent: 'Waiting for opponent...',
                    search_msg: 'Open games:',
                    search_msg_found: 'The opponent is connected',
                    search_msg_found_nd: 'Roll the dice: Bet is',
                },
            },

        },
        referral: {
            option: 'Referral link',
            get: 'Create link',
            profile: 'Profile',

            balance: 'You have earned:',
            ref_link: 'Your referral link',
            people_in: 'Invited people:',
            no_referral_link: 'You don\'t have a referral link yet',
            have_referral_link: 'You already have a referral link!',

            ref_percentage: 'Your referral level is',

            ref_options_profile: {
                withdrawn: 'Add to my balance',
                back: 'Back',
            },
        },
        wallet: {
            option: 'Wallet',
            topup: 'Crypto Pay',
            withdrawl: 'Withdrawals',
            payment_msg: 'Enter amount in ',
            withdrawls_message: 'Message was sent',
            help: 'How to top up?',
            options: ['Crypto', 'Fiat'],
            back: 'Back',
            topup_back: 'Back to wallet',
            fiat_later: 'We will add it later...',

            topup_message_crypto: 'Please, choose the currency',
            topup_message_topup: 'Enter the amount you want to deposit',
            topup_message_currency: 'Choose how you want to recharge:',

            pay: 'Pay',

            low_balance: 'You must have $0.10 in your account to play',

            promocode: 'Promocode',
            promocode_activate: 'Enter promocode',
            promocode_activated: 'Promocode activated:',
            promocode_not_activated: 'Promocode не is not valid',
            promoused: 'You have active promo',
        }
    },
};



module.exports = { 
    translate , 
    languageState ,
    
    };