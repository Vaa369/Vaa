const express = require('express');
const router = express.Router();

router.post('/webhook/whatsapp', (req, res) => {
  // Placeholder for WhatsApp Business webhook
  res.json({ ok: true });
});

router.post('/webhook/telegram', (req, res) => {
  // Placeholder for Telegram webhook
  res.json({ ok: true });
});

module.exports = router;