// Importo le librerie
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
require('dotenv').config();

// Variabili ambiente
const bot = new Telegraf(process.env.BOT_TOKEN);
const RPC_URL = process.env.RPC_URL;
const TOKEN_CA = process.env.TOKEN_CA;
const POOL_ID = process.env.POOL_ID;
const CHAT_ID = '-1002358567825';

let notificationsEnabled = true; // Stato ON/OFF notifiche
let lastVolume = 0; // Per rilevare nuove transazioni

// Funzione per recuperare dati pool GeckoTerminal
async function fetchPoolData() {
    const url = `https://api.geckoterminal.com/api/v2/networks/solana/pools/${POOL_ID}`;
    const response = await axios.get(url);
    return response.data.data.attributes;
}

// Funzione per inviare il messaggio Telegram
async function sendBuyNotification(volumeUsd) {
    try {
        const poolData = await fetchPoolData();

        const spentUsd = (volumeUsd).toFixed(2);
        const spentSol = (spentUsd / poolData.base_token_price_in_usd).toFixed(4);
        const gotTokens = (spentUsd * 1000).toFixed(0); // Stima
        const price = parseFloat(poolData.base_token_price_in_usd).toFixed(8);
        const marketCap = poolData.base_token_market_cap_usd
            ? `$${parseFloat(poolData.base_token_market_cap_usd).toLocaleString()}`
            : 'N/A';

        await bot.telegram.sendPhoto(
            CHAT_ID,
            'https://teal-efficient-beaver-393.mypinata.cloud/ipfs/bafybeidzr2d46uluvcxqpmoa5rs4d37ih6kvkwl7cdh26ze2lms6awpi64',
            {
                caption: `🚀 GRUMPYSHIBA COIN – NEW BUY! [$GSHIBA]\n\n💵 Spent: $${spentUsd} / ${spentSol} SOL\n🐾 Got: ${gotTokens} $GSHIBA\n🧾 Buyer: [N/A]\n🧾 TX: [N/A]\n\n📈 Position: 0.00%\n💰 Price: $${price}\n🧢 Market Cap: ${marketCap}`,
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [
                        Markup.button.url('📊 Chart', `https://www.geckoterminal.com/solana/pools/${POOL_ID}`),
                        Markup.button.url('🛒 Buy', `https://jup.ag/tokens/${TOKEN_CA}`)
                    ],
                    [
                        Markup.button.url('🔥 Trending', `https://coinhall.org/solana/token/${TOKEN_CA}`)
                    ]
                ])
            }
        );
    } catch (error) {
        console.error('Errore invio notifica:', error.message);
    }
}

// Polling ogni 5 secondi per nuovi eventi
setInterval(async () => {
    if (!notificationsEnabled) return;

    try {
        const poolData = await fetchPoolData();
        const currentVolume = parseFloat(poolData.base_token_volume_usd_24h);

        if (currentVolume > lastVolume) {
            const volumeDelta = currentVolume - lastVolume;
            lastVolume = currentVolume;
            sendBuyNotification(volumeDelta);
        }
    } catch (error) {
        console.error('Errore fetch pool:', error.message);
    }
}, 5000);

// Comando /test
bot.command('test', async (ctx) => {
    try {
        await bot.telegram.sendPhoto(
            CHAT_ID,
            'https://teal-efficient-beaver-393.mypinata.cloud/ipfs/bafybeidzr2d46uluvcxqpmoa5rs4d37ih6kvkwl7cdh26ze2lms6awpi64',
            {
                caption: `🚀 GRUMPYSHIBA COIN – NEW BUY! [$GSHIBA]

💵 Spent: $15.00 / 0.1 SOL
🐾 Got: 15000 $GSHIBA
🧾 Buyer: [Test Wallet](https://solscan.io/account/TEST)
🧾 TX: [Test TX](https://solscan.io/tx/TEST)

📈 Position: 0.00%
💰 Price: $0.00001
🧢 Market Cap: $100,000`,
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [
                        Markup.button.url('📊 Chart', `https://www.geckoterminal.com/solana/pools/${POOL_ID}`),
                        Markup.button.url('🛒 Buy', `https://jup.ag/tokens/${TOKEN_CA}`)
                    ],
                    [
                        Markup.button.url('🔥 Trending', `https://coinhall.org/solana/token/${TOKEN_CA}`)
                    ]
                ])
            }
        );
        ctx.reply('✅ Test BUY inviato!');
    } catch (error) {
        console.error('Errore invio test:', error.message);
        ctx.reply('❌ Errore invio test.');
    }
});

// Comando /on
bot.command('on', (ctx) => {
    notificationsEnabled = true;
    ctx.reply('✅ Notifiche automatiche ATTIVATE!');
});

// Comando /off
bot.command('off', (ctx) => {
    notificationsEnabled = false;
    ctx.reply('🛑 Notifiche automatiche DISATTIVATE!');
});

// Start bot
bot.launch();

// Shutdown sicuro
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

console.log('🤖 GrumpyShiba Coin bot live! (HTTP polling su volume ogni 5 secondi)');

