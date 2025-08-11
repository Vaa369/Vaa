const path = require('path');
const fs = require('fs/promises');
const express = require('express');

const router = express.Router();
const DATA_PATH = path.join(__dirname, '..', 'database', 'products', 'data.json');

async function readProducts() {
  const raw = await fs.readFile(DATA_PATH, 'utf-8');
  return JSON.parse(raw || '[]');
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

module.exports = router;