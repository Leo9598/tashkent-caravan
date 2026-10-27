const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const handlerPromise = import('data:text/javascript;base64,' + fs.readFileSync(path.join(__dirname, '../api/send-telegram.js')).toString('base64')).then(module => module.default);
let calls;
let originalFetch;
let originalToken;
let originalChat;
beforeEach(() => {
  calls = [];
  originalFetch = global.fetch;
  originalToken = process.env.TELEGRAM_BOT_TOKEN;
  originalChat = process.env.TELEGRAM_CHAT_ID;
  process.env.TELEGRAM_BOT_TOKEN = 'test-token';
  process.env.TELEGRAM_CHAT_ID = 'test-chat';
  global.fetch = async (url, options) => { calls.push({ url, body: JSON.parse(options.body) }); return { ok: true, json: async () => ({ ok: true }) }; };
});
afterEach(() => {
  global.fetch = originalFetch;
  if (originalToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN; else process.env.TELEGRAM_BOT_TOKEN = originalToken;
  if (originalChat === undefined) delete process.env.TELEGRAM_CHAT_ID; else process.env.TELEGRAM_CHAT_ID = originalChat;
});
const validOrder = () => ({
  name: 'Test Customer', phone: '+373 (60) 000-000', notes: 'Ring once', fulfillment: 'delivery',
  delivery: { city: 'Chișinău', street: 'Test Street 1', apartment: '12', access: 'Entrance 2, floor 3' },
  cart: [{ name: 'Plov', price: 150, qty: 2 }], total: 1
});
async function request(body, method = 'POST') {
  const result = {};
  const res = { setHeader() {}, status(code) { result.code = code; return this; }, json(body) { result.body = body; return this; }, end() { return this; } };
  await (await handlerPromise)({ method, body }, res);
  return result;
}
test('delivery includes contact, complete address, instructions and a recomputed food subtotal', async () => {
  assert.equal((await request(validOrder())).code, 200);
  assert.equal(calls.length, 1);
  const message = calls[0].body.text;
  for (const text of ['LIVRARE', '+37360000000', 'Test Street 1', '12', 'Entrance 2, floor 3', 'Ring once', 'SUBTOTAL PREPARATE: 300 lei', 'Costul livrării nu este inclus']) assert.ok(message.includes(text), text);
});
test('delivery rejects missing address and invalid contact details before contacting Telegram', async () => {
  for (const patch of [{ delivery: null }, { delivery: { city: '', street: 'Test Street 1' } }, { delivery: { city: 'Chișinău', street: '' } }, { phone: 'abc' }, { name: '' }, { fulfillment: 'unknown' }]) {
    assert.equal((await request({ ...validOrder(), ...patch })).code, 400);
  }
  assert.equal(calls.length, 0);
});
test('pickup and dine-in discard stale delivery address data', async () => {
  for (const fulfillment of ['pickup', 'dine_in']) {
    assert.equal((await request({ ...validOrder(), fulfillment })).code, 200);
    assert.ok(!calls.at(-1).body.text.includes('Test Street 1'));
    assert.ok(!calls.at(-1).body.text.includes('Apartament'));
  }
});
test('older cached forms remain compatible', async () => {
  const order = validOrder();
  delete order.fulfillment;
  order.cart = [{ ro: { name: 'Plov Tașkent' }, price: 150, qty: 1 }];
  assert.equal((await request(order)).code, 200);
  assert.match(calls[0].body.text, /ÎN RESTAURANT/);
  assert.match(calls[0].body.text, /Plov Tașkent/);
});
test('names, notes, meal names and address text are escaped for Telegram HTML', async () => {
  const order = validOrder();
  order.name = '<b>Test</b>';
  order.notes = 'A & B';
  order.delivery.street = '<script>Test Street 1</script>';
  order.cart[0].name = '<i>Plov</i>';
  await request(order);
  assert.ok(!calls[0].body.text.includes('<script>'));
  for (const text of ['&lt;b&gt;Test&lt;/b&gt;', 'A &amp; B', '&lt;i&gt;Plov&lt;/i&gt;']) assert.ok(calls[0].body.text.includes(text));
});
test('invalid quantities, prices and oversized orders never reach Telegram', async () => {
  for (const cart of [[], [{ name: 'Plov', price: -1, qty: 1 }], [{ name: 'Plov', price: 150, qty: 1.5 }], [{ name: 'Plov', price: Infinity, qty: 1 }]]) assert.equal((await request({ ...validOrder(), cart })).code, 400);
  const longOrder = validOrder();
  longOrder.cart = Array.from({ length: 50 }, () => ({ name: 'A'.repeat(160), price: 150, qty: 1 }));
  assert.equal((await request(longOrder)).body.code, 'ORDER_TOO_LONG');
  assert.equal(calls.length, 0);
});
test('upstream errors never report an order as sent', async () => {
  global.fetch = async () => ({ ok: false, json: async () => ({ ok: false }) });
  assert.equal((await request(validOrder())).code, 502);
});
test('apartment and entry instructions are optional for delivery', async () => {
  const order = validOrder();
  order.delivery = { city: 'Chișinău', street: 'Test Street 1' };
  assert.equal((await request(order)).code, 200);
  assert.ok(!calls[0].body.text.includes('Apartament'));
});
test('an unconfigured order channel reports unavailable without a network request', async () => {
  delete process.env.TELEGRAM_BOT_TOKEN;
  assert.equal((await request(validOrder())).code, 503);
  assert.equal(calls.length, 0);
});
