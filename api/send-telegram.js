// Vercel Serverless Function to send food pre-orders directly to a Telegram Bot / Channel
// Env vars required in Vercel project settings:
// - TELEGRAM_BOT_TOKEN
// - TELEGRAM_CHAT_ID

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
  }

  const { cart, total, name = 'Client Anonim', phone = '', notes = '' } = req.body || {};

  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ status: 'error', message: 'Coșul este gol / Cart is empty' });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID environment variables');
    return res.status(500).json({
      status: 'error',
      message: 'Telegram bot settings are not configured on server (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID).'
    });
  }

  // Format order date & time (Europe/Chisinau timezone offset or standard)
  const now = new Date();
  const timeString = now.toLocaleDateString('ro-MD', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Build Markdown formatted message for Telegram
  let itemsList = '';
  cart.forEach((item, index) => {
    const itemTotal = item.price * item.qty;
    const itemName = item.ro?.name || item.ru?.name || item.name || 'Produs';
    itemsList += `${index + 1}. <b>${itemName}</b> × ${item.qty} = <b>${itemTotal} lei</b>\n`;
  });

  const telegramMessage = `
🍲 <b>COMANDĂ NOUĂ — TASHKENT CARAVAN</b>
───────────────
👤 <b>Client:</b> ${escapeHtml(name)}
📞 <b>Telefon:</b> <a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a>
${notes ? `📝 <b>Masa / Note:</b> ${escapeHtml(notes)}\n` : ''}🕒 <b>Data & Ora:</b> ${timeString}
───────────────
📋 <b>CONȚINUT COMANDĂ:</b>
${itemsList}
💰 <b>SUMĂ TOTALĂ:</b> <u><b>${total} lei</b></u>
───────────────
🌐 <i>Comandă plasată de pe site-ul tashkent-caravan.vercel.app</i>
  `.trim();

  try {
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: telegramMessage,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    const result = await response.json();

    if (result.ok) {
      return res.status(200).json({
        status: 'success',
        message: 'Comanda a fost trimisă cu succes în Telegram!'
      });
    } else {
      console.error('Telegram API error:', result);
      return res.status(500).json({
        status: 'error',
        message: `Eroare Telegram API: ${result.description || 'Eroare necunoscută'}`
      });
    }
  } catch (err) {
    console.error('Server error sending to Telegram:', err);
    return res.status(500).json({
      status: 'error',
      message: err.message || 'Eroare la trimiterea comenzii'
    });
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
