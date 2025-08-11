const path = require('path');
const fs = require('fs/promises');
const express = require('express');

const router = express.Router();
const ORDERS_PATH = path.join(__dirname, '..', '..', 'database', 'orders', 'data.json');

async function readOrders() {
  const raw = await fs.readFile(ORDERS_PATH, 'utf-8');
  return JSON.parse(raw || '[]');
}

router.get('/track/:orderId', async (req, res, next) => {
  try {
    const orders = await readOrders();
    const order = orders.find((o) => String(o.id) === String(req.params.orderId));
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ orderId: order.id, status: order.status, tracking: order.tracking || [] });
  } catch (e) {
    next(e);
  }
});

module.exports = router;