const path = require('path');
const fs = require('fs/promises');
const express = require('express');
const Fuse = require('fuse.js');

const router = express.Router();
const PRODUCTS_PATH = path.join(__dirname, '..', '..', 'database', 'products', 'data.json');
const HISTORY_PATH = path.join(__dirname, '..', '..', 'database', 'search-history', 'data.json');

async function loadProducts() {
  const raw = await fs.readFile(PRODUCTS_PATH, 'utf-8');
  return JSON.parse(raw || '[]');
}
async function readHistory(){
  try{ const raw = await fs.readFile(HISTORY_PATH,'utf-8'); return JSON.parse(raw||'[]'); }
  catch{ return []; }
}
async function writeHistory(h){ await fs.writeFile(HISTORY_PATH, JSON.stringify(h, null, 2)); }

router.get('/suggest', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 1) return res.json([]);
    const products = await loadProducts();
    const fuse = new Fuse(products, { keys: ['name', 'description', 'category'], threshold: 0.4 });
    const results = fuse.search(q).slice(0, 10).map((r) => ({ id: r.item.id, name: r.item.name, category: r.item.category }));
    res.json(results);
  } catch (e) {
    next(e);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { q } = req.query;
    const products = await loadProducts();
    let results = products;
    if (q) {
      const fuse = new Fuse(products, { keys: ['name', 'description', 'category'], threshold: 0.4 });
      results = fuse.search(q).map((r) => r.item);
      // log history
      const h = await readHistory();
      h.push({ q, at: new Date().toISOString(), ip: req.ip });
      await writeHistory(h);
    }
    res.json(results);
  } catch (e) {
    next(e);
  }
});

module.exports = router;