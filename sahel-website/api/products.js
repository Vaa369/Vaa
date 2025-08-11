const path = require('path');
const fs = require('fs/promises');
const express = require('express');
const { auth, requireRole } = require('./_auth');

const router = express.Router();
const DATA_PATH = path.join(__dirname, '..', 'database', 'products', 'data.json');

async function readProducts() {
  const raw = await fs.readFile(DATA_PATH, 'utf-8');
  return JSON.parse(raw || '[]');
}
async function writeProducts(products) {
  await fs.writeFile(DATA_PATH, JSON.stringify(products, null, 2));
}

router.get('/', async (req, res, next) => {
  try {
    const { q, category, minPrice, maxPrice } = req.query;
    let products = await readProducts();
    if (q) {
      const query = q.toLowerCase();
      products = products.filter((p) => (p.name || '').toLowerCase().includes(query) || (p.description || '').toLowerCase().includes(query));
    }
    if (category) products = products.filter((p) => p.category === category);
    if (minPrice) products = products.filter((p) => Number(p.price) >= Number(minPrice));
    if (maxPrice) products = products.filter((p) => Number(p.price) <= Number(maxPrice));
    res.json(products);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const products = await readProducts();
    const product = products.find((p) => String(p.id) === String(req.params.id));
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (e) {
    next(e);
  }
});

// Admin: create product
router.post('/', auth, requireRole(['admin']), async (req, res, next) => {
  try {
    const products = await readProducts();
    const id = 'p' + Date.now();
    const p = { id, name: '', price: 0, category: '', description: '', images: [], ...req.body };
    products.push(p);
    await writeProducts(products);
    res.status(201).json(p);
  } catch (e) { next(e); }
});

// Admin: update product
router.put('/:id', auth, requireRole(['admin']), async (req, res, next) => {
  try {
    const products = await readProducts();
    const i = products.findIndex((p) => String(p.id) === String(req.params.id));
    if (i === -1) return res.status(404).json({ message: 'Not found' });
    products[i] = { ...products[i], ...req.body };
    await writeProducts(products);
    res.json(products[i]);
  } catch (e) { next(e); }
});

// Admin: delete product
router.delete('/:id', auth, requireRole(['admin']), async (req, res, next) => {
  try {
    const products = await readProducts();
    const i = products.findIndex((p) => String(p.id) === String(req.params.id));
    if (i === -1) return res.status(404).json({ message: 'Not found' });
    const removed = products.splice(i, 1)[0];
    await writeProducts(products);
    res.json(removed);
  } catch (e) { next(e); }
});

module.exports = router;