
import nest_asyncio
nest_asyncio.apply()

import asyncio
import aiohttp
from telegram import Bot, Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes
from telegram.constants import ParseMode

# === CONFIG ===
TOKEN = "7647549583:AAGTYLgZstYv6Pcy6xUIwDp5Fc11DsCCXx8"
CHAT_ID = -1002358567825  # gruppo Telegram
OWNER_ID = 33189346       # tua chat privata
PAIR_URL = "https://api.dexscreener.com/latest/dex/pairs/solana/4e9XAvAzKiu3BEoUhMorzk5t6CjdxWKtvW2KvGvfCUGH"
IMAGE_URL = "https://teal-efficient-beaver-393.mypinata.cloud/ipfs/bafybeidzr2d46uluvcxqpmoa5rs4d37ih6kvkwl7cdh26ze2lms6awpi64"

bot = Bot(token=TOKEN)
LAST_BUY_COUNT = 0
monitor_active = False

async def notify_buy(pair_data):
    price = float(pair_data.get("priceUsd", 0))
    fdv = pair_data.get("fdv", "N/A")

    text = "*GrumpyShiba Coin is on the move!* 🚀\n\n"
    text += (
        f"‼️ *NEW BUY DETECTED!*\n\n"
        f"• *Estimated Price:* ${price:.8f}\n"
        f"• *Market Cap:* ${fdv}\n"
        f"• *Buy detected via Dexscreener!*"
    )

    buttons = InlineKeyboardMarkup([
        [
            InlineKeyboardButton("📈 Chart", url="https://birdeye.so/token/tKVGfxUQkJNq8erH7o6rA7t177goR9NvCZTieoTRSgk?chain=solana"),
            InlineKeyboardButton("🛒 Buy", url="https://jup.ag/tokens/tKVGfxUQkJNq8erH7o6rA7t177goR9NvCZTieoTRSgk"),
            InlineKeyboardButton("🔥 Trending", url="https://dexscreener.com/solana/4e9XAvAzKiu3BEoUhMorzk5t6CjdxWKtvW2KvGvfCUGH")
        ]
    ])

    await bot.send_photo(
        chat_id=CHAT_ID,
        photo=IMAGE_URL,
        caption=text,
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=buttons
    )

async def monitor_buys():
    global LAST_BUY_COUNT, monitor_active
    while True:
        if monitor_active:
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(PAIR_URL) as resp:
                        if resp.status == 200:
                            data = await resp.json()
                            pair = data["pairs"][0]
                            buys_now = pair.get("txns", {}).get("m5", {}).get("buys", 0)

                            print(f"Buy count attuale: {buys_now}, precedente: {LAST_BUY_COUNT}")

                            if buys_now > LAST_BUY_COUNT:
                                await notify_buy(pair)
                                LAST_BUY_COUNT = buys_now
            except Exception as e:
                print("Errore monitor:", e)

        await asyncio.sleep(10)

async def on_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    global monitor_active
    if update.effective_user.id == OWNER_ID:
        monitor_active = True
        await context.bot.send_message(chat_id=OWNER_ID, text="✅ Monitor attivato.")
    else:
        await context.bot.send_message(chat_id=update.effective_chat.id, text="❌ Non sei autorizzato.")

async def off_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    global monitor_active
    if update.effective_user.id == OWNER_ID:
        monitor_active = False
        await context.bot.send_message(chat_id=OWNER_ID, text="🛑 Monitor disattivato.")
    else:
        await context.bot.send_message(chat_id=update.effective_chat.id, text="❌ Non sei autorizzato.")

async def status_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    status = "🟢 ATTIVO" if monitor_active else "🔴 INATTIVO"
    if update.effective_user.id == OWNER_ID:
        await context.bot.send_message(chat_id=OWNER_ID, text=f"📡 Monitor attuale: {status}")
    else:
        await context.bot.send_message(chat_id=update.effective_chat.id, text="❌ Non sei autorizzato.")

async def main():
    app = ApplicationBuilder().token(TOKEN).build()
    app.add_handler(CommandHandler("on", on_command))
    app.add_handler(CommandHandler("off", off_command))
    app.add_handler(CommandHandler("status", status_command))
    asyncio.create_task(monitor_buys())
    print("Bot avviato. Usa /on /off /status dalla tua chat privata.")
    await app.run_polling()

asyncio.run(main())
