require('dotenv').config();

const deepLink = process.env.TELEGRAMDEEPLINK;


const generateReferralCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"; 
    let result = '';

    for (let i = 0; i < 8; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
      }

    return deepLink + result;
}

module.exports = { generateReferralCode };