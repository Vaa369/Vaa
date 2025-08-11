const path = require('path');
const fs = require('fs/promises');
const express = require('express');

const router = express.Router();
const ORDERS_PATH = path.join(__dirname, '..', 'database', 'orders', 'data.json');

async function readOrders() {
  const raw = await fs.readFile(ORDERS_PATH, 'utf-8');
  return JSON.parse(raw || '[]');
}
async function writeOrders(orders) {
  await fs.writeFile(ORDERS_PATH, JSON.stringify(orders, null, 2));
}

router.post('/', async (req, res, next) => {
  try {
    const { userId, items, address, paymentMethod } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No items' });
    }
    const total = items.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.qty || 1), 0);
    const order = {
      id: Date.now().toString(),
      userId: userId || null,
      items,
      address: address || '',
      paymentMethod: paymentMethod || 'cod',
      status: 'processing',
      total,
      createdAt: new Date().toISOString(),
      tracking: [
        { status: 'processing', at: new Date().toISOString(), note: 'Order received' }
      ],
    };
    const orders = await readOrders();
    orders.push(order);
    await writeOrders(orders);
    res.status(201).json(order);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const orders = await readOrders();
    const order = orders.find((o) => String(o.id) === String(req.params.id));
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (e) {
    next(e);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { userId } = req.query;
    let orders = await readOrders();
    if (userId) orders = orders.filter((o) => o.userId === userId);
    res.json(orders);
  } catch (e) {
    next(e);
  }
});

module.exports = router;