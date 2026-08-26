const fs = require('fs');
const path = require('path');

const STATUS_FILE = path.join('/tmp', 'tashkent_global_site_status.json');

function getGlobalStatus() {
  if (fs.existsSync(STATUS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
      return data.isOpen !== false;
    } catch (err) {
      return true;
    }
  }
  return true;
}

function setGlobalStatus(isOpen) {
  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify({ isOpen, updated_at: new Date().toISOString() }), 'utf8');
  } catch (err) {
    console.error('Error writing status file:', err);
  }
}

export default async function handler(req, res) {
  // Allow CORS for all devices
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const isOpen = getGlobalStatus();
    return res.status(200).json({ isOpen });
  }

  if (req.method === 'POST') {
    const { pin, isOpen } = req.body || {};
    if (pin !== '111221' && pin !== 'admin') {
      return res.status(401).json({ status: 'error', message: 'Invalid PIN code' });
    }

    setGlobalStatus(Boolean(isOpen));
    return res.status(200).json({ status: 'success', isOpen: Boolean(isOpen) });
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
