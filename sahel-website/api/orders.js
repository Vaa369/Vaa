const path = require('path');
const fs = require('fs/promises');
const express = require('express');
const { auth, requireRole } = require('./_auth');

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

router.get('/', auth, async (req, res, next) => {
  try {
    const { userId, status } = req.query;
    let orders = await readOrders();
    if (userId) orders = orders.filter((o) => o.userId === userId);
    if (status) orders = orders.filter((o) => o.status === status);
    res.json(orders);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id/status', auth, requireRole(['admin']), async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const orders = await readOrders();
    const i = orders.findIndex((o) => String(o.id) === String(req.params.id));
    if (i === -1) return res.status(404).json({ message: 'Not found' });
    orders[i].status = status || orders[i].status;
    (orders[i].tracking = orders[i].tracking || []).push({ status: orders[i].status, at: new Date().toISOString(), note: note || '' });
    await writeOrders(orders);
    res.json(orders[i]);
  } catch (e) { next(e); }
});

module.exports = router;