const path = require('path');
const fs = require('fs/promises');
const express = require('express');

const router = express.Router();
const ORDERS_PATH = path.join(__dirname, '..', '..', 'database', 'orders', 'data.json');

async function readOrders() {
  const raw = await fs.readFile(ORDERS_PATH, 'utf-8');
  return JSON.parse(raw || '[]');
}

router.get('/reports/summary', async (req, res, next) => {
  try {
    const orders = await readOrders();
    const totalOrders = orders.length;
    const revenue = orders.filter((o) => o.status === 'paid' || o.status === 'delivered').reduce((s, o) => s + Number(o.total || 0), 0);
    const processing = orders.filter((o) => o.status === 'processing').length;
    const delivered = orders.filter((o) => o.status === 'delivered').length;
    const canceled = orders.filter((o) => o.status === 'canceled').length;
    res.json({ totalOrders, revenue, processing, delivered, canceled });
  } catch (e) {
    next(e);
  }
});

module.exports = router;