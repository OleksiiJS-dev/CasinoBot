require('dotenv').config();

const deepLink = process.env.TELEGRAM_DEEP_LINK;


const generateReferralCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"; 
    let result = '';

    for (let i = 0; i < 8; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
      }

    return result;
}

module.exports = { generateReferralCode };