const nodemailer = require('nodemailer');

function generateOrderHtml(cart, total, customerName = 'Guest', customerPhone = '', notes = '') {
  const submittedAt = new Date().toLocaleString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' UTC';

  let itemsHtml = '';
  cart.forEach(item => {
    const itemTotal = item.price * item.qty;
    itemsHtml += `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee7db; color: #1e293b; font-weight: 600; font-size: 14px;">${item.name}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee7db; color: #64748b; font-size: 14px; text-align: center;">${item.qty}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee7db; color: #d4af37; font-weight: 700; font-size: 14px; text-align: right;">${itemTotal} lei</td>
      </tr>
    `;
  });

  const notesHtml = notes ? `
    <div style="background-color: #fbf8f3; border-left: 4px solid #d4af37; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-top: 20px;">
      <div style="font-size: 11px; font-weight: 700; color: #a8841a; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">📝 Notes / Special Instructions</div>
      <div style="font-size: 14px; color: #334155; font-style: italic;">"${notes}"</div>
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Pre-Order - Tashkent</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b111e; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b111e; padding: 40px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #092c28 0%, #0d5c58 60%, #c85a28 100%); padding: 36px 30px; text-align: center; border-bottom: 3px solid #d4af37;">
              <div style="font-size: 11px; font-weight: 700; color: #d4af37; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 8px;">TASHKENT • ТАШКЕНТ</div>
              <h1 style="margin: 0; font-size: 26px; color: #ffffff; font-weight: 700;">New Food Pre-Order</h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px; background-color: #ffffff;">
              <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;">
                <p style="margin: 0 0 8px 0; font-size: 15px; color: #1e293b;"><strong>Customer Name:</strong> ${customerName}</p>
                ${customerPhone ? `<p style="margin: 0 0 8px 0; font-size: 15px; color: #1e293b;"><strong>Phone:</strong> <a href="tel:${customerPhone}" style="color: #0d5c58; font-weight: 700; text-decoration: none;">${customerPhone}</a></p>` : ''}
                <p style="margin: 0; font-size: 13px; color: #64748b;"><strong>Order Date:</strong> ${submittedAt}</p>
              </div>

              <!-- Order Items Table -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <thead>
                  <tr>
                    <th align="left" style="padding-bottom: 8px; border-bottom: 2px solid #cbd5e1; font-size: 12px; color: #475569; text-transform: uppercase;">Item</th>
                    <th align="center" style="padding-bottom: 8px; border-bottom: 2px solid #cbd5e1; font-size: 12px; color: #475569; text-transform: uppercase;">Qty</th>
                    <th align="right" style="padding-bottom: 8px; border-bottom: 2px solid #cbd5e1; font-size: 12px; color: #475569; text-transform: uppercase;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Total Row -->
              <div style="background-color: #0b111e; color: #ffffff; padding: 16px 20px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 16px; font-weight: 600; color: #94a3b8;">Total Amount:</span>
                <span style="font-size: 22px; font-weight: 800; color: #d4af37;">${total} lei</span>
              </div>

              ${notesHtml}
            </td>
          </tr>

          <!-- Footer Banner -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
              <strong>Tashkent Restaurant</strong><br>
              Str. Mihai Eminescu 64 • Tel: 078 142 910 • 10:00 - 23:00
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { cart, total, name = 'Guest', phone = '', notes = '' } = req.body;

  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ message: 'Cart is empty' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"Tashkent Orders" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      subject: `🍲 New Tashkent Order: ${name} (${total} lei)`,
      html: generateOrderHtml(cart, total, name, phone, notes),
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ status: 'success', message: 'Order email sent successfully!' });
  } catch (error) {
    console.error('Error sending order email:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
}
