require('dotenv').config();

const Bot = require('node-telegram-bot-api');
const token = process.env.TELEGRAM_TOKEN;
const bot = new Bot(token, { polling: true });
const mongoose = require('mongoose');
const mongooseUrl = process.env.MONGO_URL;
const { CryptoPay } = require('@foile/crypto-pay-api');
const cryptoToken = process.env.CRYPTO_TOKEN;


// const connectToDb = () => {
//   mongoose
//     .connect(mongooseUrl, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     })
//     .then(() => {
//       console.log('Подключено к базе');
//     })
//     .catch((e) => {
//       console.log(e);
//     });
// };
// connectToDb();


// const express = require('express')
// const app = express()
// app.use(express.json());
// app.listen('/HSDHHDSKKKFFLLLSHJYYRYY', () => {
//   console.log('Express.js server is running on port 4200');
// });
// **************************************************************
// const createCryptoPayInvoice = new CryptoPay(cryptoToken, {
//   hostname: 'testnet-pay.crypt.bot',
//   protocol: "https",
//   webhook: {
//     serverHostname: 'tcb-bot.herokuapp.com',
//     path: '/HSDHHDSKKKFFLLLSHJYYRYY'
//   },
// });
// app.post('/HSDHHDSKKKFFLLLSHJYYRYY', (req, res) => {
//   const update = req.body;

//   if (update.type === 'invoice_paid') {
//     console.log('Invoice Paid Event:', update.payload);
//   }

//   res.sendStatus(200);
// });
// const webhookUrl = 'https://tcb-bot.herokuapp.com'
// bot.setWebHook(webhookUrl);



const { translate } = require('./languages');

const { generatePromocode } = require('./Functions/generatePromocode');
const { generateReferralCode } = require('./Functions/generateReferralCode');
const { generateIdTimeStamp } = require('./Functions/generateIdTimeStamp');
const {
  Admin,
  User,
  Wallet,
  Status,
  Program,
  Settings,
  Payment,
  Global,
} = require("./DB/mongoSchema");
const {
  startOptions,
  settingsOptions,
  languageOptions,
  walletOptions,
  topUpOptions,
  slotLowBalance,
  gamesOptions,
  slotOptions,
  diceOptions,
  boneGameOptions,
  boneGameOptionsCreating,
  boneGameOptionThrow,
  referralOptions,
  referralBalanceProfile,
} = require('./options/options')(translate);
const {
  adminOptions,
  promocodeOption,
  deleteMessage,
  adminAplicationRequestFirst,
  adminAplicationRequestSecond,
  adminAplicationRequestFinal,
} = require('./options/adminOptions');



const asyncMessage = async (message) => {
  return message;
};
// start
const adminList = async (key) => {
  const response = await Admin.find({ ID: "ADMIN" });
  return response
};
const createNewUser = async (key) => {
  const id = key.from.id.toString()
  const newUser = new User({
    _id: id,
    name: key.from.username,
  })
  const newUserWallet = new Wallet({
    _id: id,
    amount: 0,
  })
  const newUserStatus = new Status({
    _id: id,
    level_ru: translate.ru.profile.status_lvl[0],
    level_en: translate.en.profile.status_lvl[0],
    monthly_spend: 0
  })
  const newUserProgram = new Program({
    _id: id,
    code: '',
    count: 0,
    percent: 0,
    earning: 0,
    invited_by: '',
  })
  const newUserSettings = new Settings({
    _id: id,
    language: key.from.language_code,
    slots: {
      bet: 5,
      maxbet: 100,
    },
    dice: {
      bet: 5,
      maxbet: 100,
      position: [],
    }
  })
  await newUser.save();
  await newUserWallet.save();
  await newUserStatus.save();
  await newUserProgram.save();
  await newUserSettings.save();
  return newUser;
};
const createNewUserWithLink = async (message, messageLink) => {
  const id = message.from.id.toString()
  const newUser = new User({
    _id: id,
    name: message.from.username,
  })
  const newUserWallet = new Wallet({
    _id: id,
    amount: 0,
  })
  const newUserStatus = new Status({
    _id: id,
    level_ru: translate.ru.profile.status_lvl[0],
    level_en: translate.en.profile.status_lvl[0],
    monthly_spend: 0
  })
  const newUserProgram = new Program({
    _id: id,
    code: '',
    count: 0,
    percent: 0,
    earning: 0,
    invited_by: messageLink,
  })
  const newUserSettings = new Settings({
    _id: id,
    language: message.from.language_code,
    slots: {
      bet: 5,
      maxbet: 100,
    },
    dice: {
      bet: 5,
      maxbet: 100,
      position: [],
    }
  })
  await newUser.save();
  await newUserWallet.save();
  await newUserStatus.save();
  await newUserProgram.save();
  await newUserSettings.save();
  console.log('|user saved')
  return newUser;
};
const updateOwnerInformation = async (message, messageLink) => {
  const owner = await Program.findOne({ code: messageLink });

  owner.count = owner.count + 1;
  owner.save();
  await percentFromInvetedPeople(owner);
};
const updateExistingUserProgram = async (message, messageLink) => {
  const userProgram = await Program.findOne({ _id: message.from.id })
  userProgram.invited_by = messageLink
  userProgram.save()
  const linkOwner = await Program.findOne({ code: messageLink })
  linkOwner.count = linkOwner.count + 1
  linkOwner.save()
  percentFromInvetedPeople(linkOwner)
};
const updateUserName = async (message) => {
  const user = await User.findOne({ _id: message.from.id });
  user.name = message.from.username;
  await user.save();
  return user
};
const sendStartProfileMessage = async (response) => {
  const user = await User.findOne({ _id: response._id });
  const settings = await Settings.findOne({ _id: response._id })
  const userWallet = await Wallet.findOne({ _id: response._id });
  const userStatus = await Status.findOne({ _id: response._id });
  const returnStatus = async () => {
    if (settings.language == 'ru') {
      return userStatus.level_ru
    }
    if (settings.language == 'en') {
      return userStatus.level_en
    }
  }
  const message = `${translate[settings.language].profile.name}: ${user.name}
  \n${translate[settings.language].profile.status}: ${await returnStatus()}
  \n${translate[settings.language].profile.balance}: ${userWallet.amount} $
    `;
  await bot.sendMessage(response._id, message, startOptions(settings.language))
};
const userInProgramChange = async (message, messageLink) => {
  const userProgram = await Program.findOne({ _id: message.from.id })
  const oldUser = await Program.findOne({ code: userProgram.invited_by })
  oldUser.count = oldUser.count - 1;
  oldUser.save()

  userProgram.invited_by = messageLink
  const newUser = await Program.findOne({ code: messageLink })
  newUser.count = newUser.count + 1
  userProgram.save()
  newUser.save()

  await percentFromInvetedPeople(userProgram);
  await percentFromInvetedPeople(newUser);
  await sendStartProfileMessage(userProgram);
};
const startWithReferralLinkHandler = async (message) => {
  const messageLink = message.text.split(' ')[1];
  const messageId = message.from.id;

  const referralLinkOwner = await Program.findOne({ code: messageLink })
  const userWhoClicked = await Program.findOne({ _id: messageId })

  if (referralLinkOwner === null) {
    // не правильная ссылка
    await referralLinkOwnerNull(message)
  }
  else if (userWhoClicked === null) {
    console.log("create USER")
    await createNewUserWithLink(message, messageLink).then(async (response) => await sendStartProfileMessage(response));

    await updateOwnerInformation(message, messageLink);

  }
  else if (referralLinkOwner._id === userWhoClicked._id) {
    await bot.sendMessage(messageId, 'Вы нажали на свою ссылку')

  }
  else if (userWhoClicked.invited_by === messageLink) {
    await bot.sendMessage(messageId, 'Вы уже используете эту ссылку')
  }
  else if (userWhoClicked.invited_by === '') {
    console.log("USER HAS JOINED")
    await updateExistingUserProgram(message, messageLink);
  }
  else if (userWhoClicked.invited_by != '') {
    console.log("USER WAS USING ANOTHER REF BUT WE DELETE IT AND ")
    await userInProgramChange(message, messageLink);
  }
};
const sendStartProfileMessageOnBack = async (query) => {
  const user = await User.findOne({ _id: query.from.id });
  const settings = await Settings.findOne({ _id: query.from.id })

  const userWallet = await Wallet.findOne({ _id: user._id });
  const userStatus = await Status.findOne({ _id: user._id });
  const returnStatus = () => {
    if (settings.language == 'ru') {
      return userStatus.level_ru
    }
    if (settings.language == 'en') {
      return userStatus.level_en
    }
  }
  const message = `${translate[settings.language].profile.name}: ${user.name}
  \n${translate[settings.language].profile.status}: ${returnStatus()}
  \n${translate[settings.language].profile.balance}: ${userWallet.amount} $
    `;
  await bot.editMessageText(message,
    {
      chat_id: query.from.id,
      message_id: query.message.message_id,
      reply_markup: startOptions(settings.language).reply_markup,
    });

};
const referralLinkOwnerNull = async (message) => {
  await User.findOne({ _id: message.from.id }).then(async (response) => {

    if (response) {
      await sendStartProfileMessage(response);
    } else {
      console.log('createuser')
      await createNewUser(message).then(async (response) => await sendStartProfileMessage(response))
    }
  })
};
const percentFromInvetedPeople = async (user) => {

  const globalSettings = await Global.findOne({ _id: "GLOBAL" });
  const userProgram = await Program.findOne({ _id: user._id })
  if (userProgram.count > 500) {
    userProgram.percent = globalSettings.ProgramPercent.FiveHundreds
    userProgram.save()
  } else if (userProgram.count > 1500) {
    userProgram.percent = globalSettings.ProgramPercent.OneThousandFiveHundred
    userProgram.save()
  } else {
    userProgram.percent = globalSettings.ProgramPercent.Zero
    userProgram.save()
  }

};
const handleStartMessage = async (message) => {
  const idNumber = message.from.id;
  const id = idNumber.toString();

  const allAdmins = await adminList();
  const allAdminsArray = allAdmins.map((index) => index._id);
  const admin = allAdminsArray.includes(id)

  if (admin) {
    bot.sendMessage(message.from.id, "Вы администратор", adminOptions)
  }
  else if (message.text === "/start") {
    await User.findOne({ _id: message.from.id })
      .then(async (response) => {
        if (response) {
          await updateUserName(message).then(async (response) => {
            await sendStartProfileMessage(response)
          })
        } else {
          console.log("create")
          await createNewUser(message).then(async (response) => {
            await sendStartProfileMessage(response)
          })
        }
      })
  }
  else {
    await startWithReferralLinkHandler(message)
  }
};
bot.onText(/\/start/, async (message) => {
  consol.log("eas start")
  // await handleStartMessage(message);
});
bot.on("callback_query", async (query) => {
  consol.log("eas user_games")
  await asyncMessage(query).then(async (query) => {
    if (query.data === 'user_games') {
      console.log(query.data)
    }
  })
});
// program
const generateProgramMessage = async (query) => {

  const userData = await User.findOne({ _id: query.from.id });
  const settings = await Settings.findOne({ _id: query.from.id });
  const userWallet = await Wallet.findOne({ _id: query.from.id });
  const userStatus = await Status.findOne({ _id: query.from.id });
  const userProgram = await Program.findOne({ _id: query.from.id });
  const globalSettings = await Global.findOne({ _id: "GLOBAL" })

  if (userProgram.code === '') {
    userProgram.code = generateReferralCode();
    userProgram.percent = globalSettings.ProgramPercent.Zero;
    userProgram.save()
  }



  const message = `${process.env.TELEGRAM_DEEP_LINK + userProgram.code}\n${translate[settings.language].referral.ref_link}\n
${translate[settings.language].referral.balance} ${userProgram.earning} $
${translate[settings.language].referral.people_in} ${userProgram.count} 
${translate[settings.language].referral.ref_percentage}: ${userProgram.percent} %\n
  `

  await bot.editMessageText(message, {
    chat_id: query.from.id,
    message_id: query.message.message_id,
    reply_markup: referralOptions(settings.language).reply_markup,
  })
}
bot.on("callback_query", async (query) => {
  await asyncMessage(query).then(async (query) => {
    if (query.data === 'user_program') {
      await generateProgramMessage(query);
    }
    if (query.data === 'referral_back') {
      await sendStartProfileMessageOnBack(query);
    }
  })
});
// wallet
const editMessageWallet = async (query) => {
  const user = await User.findOne({ _id: query.from.id });
  const settings = await Settings.findOne({ _id: query.from.id })

  const userWallet = await Wallet.findOne({ _id: user._id });
  const userStatus = await Status.findOne({ _id: user._id });

  const message = `${translate[settings.language].profile.balance}: ${userWallet.amount} $`;
  await bot.editMessageText(message,
    {
      chat_id: query.from.id,
      message_id: query.message.message_id,
      reply_markup: walletOptions(settings.language).reply_markup,
    });
}
const editTopUpMessage = async (query) => {

  const settings = await Settings.findOne({ _id: query.from.id })
  const currencies = ["USDT", "TON", "BTC", "ETH", "BNB", "BUSD", "TRX", "USDC", `${translate[settings.language].wallet.topup_back}`];
  const buttons = currencies.map(currency => ({
    text: `${currency}`,
    callback_data: currency,
  }));
  const options = {
    reply_markup: {
      inline_keyboard: buttons.map(button => [button]),
    },
  };
  await bot.editMessageText(translate[settings.language].wallet.topup_message_crypto, {
    chat_id: query.from.id,
    message_id: query.message.message_id,
    reply_markup: options.reply_markup,
  });
}
// I`m here:
const createNewPayment = async (query) => {
  const payment = new Payment({
    _id: query.from.id + generateIdTimeStamp(),
    id: query.from.id,
    currency: query.data,
    url: '',
    amount: 0,
    date: new Date(),
    pay: false
  })
  return [payment, query]
}
const createNewpaymnerAddAmount = async (payment) => {
  const settings = await Settings.findOne({ _id: payment[1].from.id })

  const message = `${translate[settings.language].wallet.payment_msg} ${payment[0].currency}`

  await bot.sendMessage(payment[1].from.id, message)

  await bot.on("message", async (msg) => {
    // console.log(msg)
    const chatId = msg.chat.id;
    const text = msg.text;
    if (msg.from.id === payment[1].from.id) {
      if (!isNaN(text)) {
        const invoice = await createCryptoPayInvoice.createInvoice(payment[0].currency, parseFloat(text), {});
        payment[0].url = invoice.pay_url
        payment[0].amount = parseFloat(text)
        payment[0].save()
        bot.sendMessage(chatId, invoice.pay_url);
        console.log(invoice);

        // 

        // 
        bot.off("message")
      }
      else {
        await bot.sendMessage(chatId, "send a number");
      }
    }
  })


}
bot.on("callback_query", async (query) => {

  await asyncMessage(query).then(async (query) => {
    if (query.data === 'user_wallet') {
      await editMessageWallet(query)
    }
    if (query.data === 'topUp') {
      await editTopUpMessage(query)
    }
    if (["USDT", "TON", "BTC", "ETH", "BNB", "BUSD", "TRX", "USDC"].includes(query.data)) {
      await createNewPayment(query).then(async (payment) => {
        await createNewpaymnerAddAmount(payment)
      })
    }
    if (query.data === 'Back to wallet' || query.data === 'Назад к кошельку') {
      await editMessageWallet(query)
    }
    if (query.data === 'wallet_back') {
      await sendStartProfileMessageOnBack(query)
    }
    // else if (query.data === 'user_wallet') {
    //   await editMessageWallet(MediaQueryList)
    // }
    // else if (query.data === 'user_wallet') {
    //   await editMessageWallet(MediaQueryList)
    // }
    // else if (query.data === 'user_wallet') {
    //   await editMessageWallet(MediaQueryList)
    // }
    // else if (query.data === 'user_wallet') {
    //   await editMessageWallet(MediaQueryList)
    // }
    // else if (query.data === 'user_wallet') {
    //   await editMessageWallet(MediaQueryList)
    // }
    // else if (query.data === 'user_wallet') {
    //   await editMessageWallet(MediaQueryList)
    // }
  })
});
// settings
const editMessageSettings = async (query) => {
  const settings = await Settings.findOne({ _id: query.from.id })
  const message = `${translate[settings.language].settings.language_selection}`
  await bot.editMessageText(message, {
    chat_id: query.from.id,
    message_id: query.message.message_id,
    reply_markup: languageOptions(settings.language).reply_markup,
  });
}
const languageToRu = async (query) => {
  const settings = await Settings.findOne({ _id: query.from.id })
  const languageFunction = async () => {
    if (settings.language === 'ru') {
      console.log("foobar")
    }
    else {
      settings.language = 'ru';
      settings.save();
      await bot.editMessageText(translate[settings.language].settings.language_selection, {
        chat_id: query.from.id,
        message_id: query.message.message_id,
        reply_markup: languageOptions(settings.language).reply_markup,
      });
    }
  }
  await languageFunction()
}
const languageToEn = async (query) => {
  const settings = await Settings.findOne({ _id: query.from.id })
  const languageFunction = async () => {
    if (settings.language === 'en') {
      console.log("foobar")
    }
    else {
      settings.language = 'en';
      settings.save();
      await bot.editMessageText(translate[settings.language].settings.language_selection, {
        chat_id: query.from.id,
        message_id: query.message.message_id,
        reply_markup: languageOptions(settings.language).reply_markup,
      });
    }
  }
  await languageFunction()
}
bot.on("callback_query", async (query) => {
  switch (query.data) {
    case 'user_settings':
      await editMessageSettings(query);
      break;
    case 'settingsToEn':
      console.log(query);
      await languageToEn(query);
      break;
    case 'settingsToRu':
      console.log(query);
      await languageToRu(query);
      break;
    case 'language_back':
      console.log(query);
      await sendStartProfileMessageOnBack(query);
      break;
    default:
      break;
  }
});

bot.on('polling_error', (error) => {
  const time = new Date();
  console.log("TIME:", time);
  console.log("CODE:", error.code);  // => 'EFATAL'
  console.log("MSG:", error.message);
  console.log("STACK:", error.stack);
});