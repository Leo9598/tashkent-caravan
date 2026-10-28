// Restaurant order requests. Existing Vercel secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', code: 'METHOD_NOT_ALLOWED' });

  let order;
  try {
    order = normalizeOrder(req.body);
  } catch {
    return res.status(400).json({ status: 'error', code: 'INVALID_ORDER' });
  }

  const modeLabels = { delivery: 'LIVRARE', pickup: 'LA PACHET / RIDICARE', dine_in: 'ÎN RESTAURANT' };
  const timeString = new Intl.DateTimeFormat('ro-MD', {
    timeZone: 'Europe/Chisinau', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(new Date());
  const address = order.delivery ? [
    `<b>Localitate:</b> ${escapeHtml(order.delivery.city)}`,
    `<b>Stradă / nr. clădire:</b> ${escapeHtml(order.delivery.street)}`,
    ...(order.delivery.apartment ? [`<b>Apartament:</b> ${escapeHtml(order.delivery.apartment)}`] : []),
    ...(order.delivery.access ? [`<b>Intrare / etaj / interfon:</b> ${escapeHtml(order.delivery.access)}`] : [])
  ].join('\n') : '';
  const itemsList = order.cart.map((item, index) => {
    const details = item.selectedSummary ? `\n   <i>${escapeHtml(item.selectedSummary)}</i>` : '';
    return `${index + 1}. <b>${escapeHtml(item.name)}</b> × ${item.qty} = <b>${formatMoney(item.price * item.qty)} lei</b>${details}`;
  }).join('\n');
  const telegramMessage = [
    '<b>COMANDĂ NOUĂ — TASHKENT</b>',
    `<b>Tip comandă: ${modeLabels[order.fulfillment]}</b>`,
    '───────────────',
    `<b>Client:</b> ${escapeHtml(order.name)}`,
    `<b>Telefon:</b> <a href="tel:${order.phone}">${order.phone}</a>`,
    ...(address ? ['<b>ADRESĂ DE LIVRARE</b>', address] : []),
    ...(order.fulfillment === 'pickup' ? ['<b>Ridicare:</b> Str. Mihai Eminescu 64, Chișinău'] : []),
    ...(order.notes ? [`<b>Comentariu:</b> ${escapeHtml(order.notes)}`] : []),
    `<b>Data & ora (Chișinău):</b> ${timeString}`,
    '───────────────',
    '<b>CONȚINUT COMANDĂ</b>', itemsList,
    `<b>${order.fulfillment === 'delivery' ? 'SUBTOTAL PREPARATE' : 'SUMĂ TOTALĂ'}: ${formatMoney(order.total)} lei</b>`,
    ...(order.fulfillment === 'delivery' ? ['<i>Costul livrării nu este inclus. Confirmați telefonic disponibilitatea, ora și costul livrării înainte de expediere.</i>'] : []),
    '<i>Contactați clientul pentru confirmarea comenzii.</i>',
    'tashkent-caravan.vercel.app'
  ].join('\n');

  // Avoid sending a partial order when the Telegram message limit would be exceeded.
  if (telegramMessage.length > 4000) return res.status(400).json({ status: 'error', code: 'ORDER_TOO_LONG' });
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) {
    console.error('Restaurant order channel is not configured');
    return res.status(503).json({ status: 'error', code: 'SERVICE_UNAVAILABLE' });
  }
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: telegramMessage, parse_mode: 'HTML', disable_web_page_preview: true })
    });
    const result = await response.json();
    if (response.ok && result.ok) return res.status(200).json({ status: 'success' });
    console.error('Restaurant order channel rejected the request');
    return res.status(502).json({ status: 'error', code: 'SERVICE_UNAVAILABLE' });
  } catch {
    console.error('Restaurant order delivery failed');
    return res.status(502).json({ status: 'error', code: 'SERVICE_UNAVAILABLE' });
  }
}

function field(value, maxLength) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string' || value.trim().length > maxLength) throw new Error('Invalid field');
  return value.trim();
}
export function normalizeOrder(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid order');
  // Older cached forms submit dine-in requests without a fulfillment field.
  const fulfillment = body.fulfillment ?? 'dine_in';
  if (!['delivery', 'pickup', 'dine_in'].includes(fulfillment)) throw new Error('Invalid fulfillment');
  const name = field(body.name, 100);
  const phone = field(body.phone, 30).replace(/[\s().-]/g, '');
  const notes = field(body.notes, 1000);
  if (name.length < 2 || !/^\+?\d{8,15}$/.test(phone)) throw new Error('Missing contact details');
  if (!Array.isArray(body.cart) || !body.cart.length || body.cart.length > 150) throw new Error('Invalid cart');
  const cart = body.cart.map(item => {
    if (!item || typeof item !== 'object' || typeof item.price !== 'number' || !Number.isFinite(item.price) || item.price < 0 || item.price > 100000 || !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 99) throw new Error('Invalid cart item');
    const itemName = field(item.ro?.name ?? item.name ?? item.ru?.name, 160);
    if (!itemName) throw new Error('Missing dish name');
    return { name: itemName, price: item.price, qty: item.qty, selectedSummary: field(item.selectedSummary, 500) };
  });
  let delivery = null;
  if (fulfillment === 'delivery') {
    if (!body.delivery || typeof body.delivery !== 'object' || Array.isArray(body.delivery)) throw new Error('Missing delivery address');
    delivery = {
      city: field(body.delivery.city, 80), street: field(body.delivery.street, 200),
      apartment: field(body.delivery.apartment, 40), access: field(body.delivery.access, 120)
    };
    if (delivery.city.length < 2 || delivery.street.length < 5) throw new Error('Incomplete delivery address');
  }
  return { fulfillment, name, phone, notes, delivery, cart, total: cart.reduce((sum, item) => sum + item.price * item.qty, 0) };
}
function formatMoney(value) { return String(Math.round(value * 100) / 100); }
function escapeHtml(text) { return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
