const adminOptions = {
        reply_markup: {
            inline_keyboard: [
                [

                    { text: 'Админы', callback_data: 'admin_admin_panel' },
                ],
                [

                    { text: 'Промокоды', callback_data: 'admin_promocodes' },
                ],
                [

                    { text: 'Информация о пользователе', callback_data: 'admin_user_info' },
                ],
            ],
        },
};
const promocodeOption = {
        reply_markup: {
            inline_keyboard: [
                [

                    { text: 'Сгенерировать 5 промокодов', callback_data: 'admin_promocodes_generate' },
                ],
                [

                    { text: 'Сгенерировать свой промокод', callback_data: 'admin_promocodes_generate_custom' },
                ],
                [

                    { text: 'Список промокодов', callback_data: 'admin_promocodes_get_all' },
                ],
                [

                    { text: 'Назад', callback_data: 'admin_promocodes_back' },
                ],

            ],
        },
};
const promocodeBase = {
        reply_markup: {
            inline_keyboard: [
                [

                    { text: 'Добавить в базу', callback_data: 'admin_promocodes_save' },
                ],
                [

                    { text: 'Вернуться назад', callback_data: 'admin_promocodes_delete' },
                ],


            ],
        },
};
const promocodeCustomCreate= {
        reply_markup: {
            inline_keyboard: [
                [

                    { text: 'Добавить в базу', callback_data: 'admin_promocodes_custom_again' },
                ],
                [

                    { text: 'Вернуться назад', callback_data: 'admin_promocodes_custom_back' },
                ],


            ],
        },
};
const deleteMessage = {
    reply_markup: {
        inline_keyboard: [
            [

                { text: 'ОК', callback_data: 'delete_message' },
            ],
        ],
    },
}
const adminAplicationRequestFirst = {
    reply_markup: {
        inline_keyboard: [
            [
                { text: 'Взять в работу 🟢', callback_data: 'aplication_in_process'},
                { text: 'Информация о пользователе', callback_data: 'aplication_info'},
            ],
        ],
    },
}
const adminAplicationRequestSecond = {
    reply_markup: {
        inline_keyboard: [
            [
                { text: 'Заявка обработана 🟠', callback_data: 'aplication_done'},
                { text: 'Информация о пользователе', callback_data: 'aplication_info'},
            ],
        ],
    },
}
const adminAplicationRequestFinal = {
    reply_markup: {
        inline_keyboard: [
            [
                { text: 'Информация о пользователе', callback_data: 'aplication_info'},
            ],
        ],
    },
}

module.exports = { 
    adminOptions ,
    promocodeOption ,
    promocodeBase ,
    deleteMessage ,
    promocodeCustomCreate ,
    adminAplicationRequestFirst ,
    adminAplicationRequestSecond ,
    adminAplicationRequestFinal ,
}