const path = require('path');
const fs = require('fs/promises');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

const router = express.Router();
const DATA_PATH = path.join(__dirname, '..', 'database', 'users', 'data.json');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

async function readUsers() {
  const raw = await fs.readFile(DATA_PATH, 'utf-8');
  return JSON.parse(raw || '[]');
}
async function writeUsers(users) {
  await fs.writeFile(DATA_PATH, JSON.stringify(users, null, 2));
}

router.post('/register', async (req, res, next) => {
  try {
    const { fullName, email, phone, address, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    const users = await readUsers();
    if (users.find((u) => u.email === email)) return res.status(409).json({ message: 'Email already exists' });
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      id: Date.now().toString(),
      fullName: fullName || '',
      email,
      phone: phone || '',
      address: address || '',
      role: 'customer',
      otpEnabled: false,
      otpSecret: null,
      createdAt: new Date().toISOString(),
      passwordHash,
    };
    users.push(newUser);
    await writeUsers(users);
    res.status(201).json({ id: newUser.id, email: newUser.email });
  } catch (e) {
    next(e);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password, otpCode } = req.body;
    const users = await readUsers();
    const user = users.find((u) => u.email === email);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    if (user.otpEnabled) {
      if (!otpCode) return res.status(401).json({ message: '2FA required', requires2fa: true });
      const verified = speakeasy.totp.verify({ secret: user.otpSecret, encoding: 'base32', token: otpCode });
      if (!verified) return res.status(401).json({ message: 'Invalid 2FA code', requires2fa: true });
    }

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 7 * 24 * 3600 * 1000 });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (e) {
    next(e);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

router.post('/2fa/setup', async (req, res, next) => {
  try {
    const { email } = req.body;
    const users = await readUsers();
    const user = users.find((u) => u.email === email);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const secret = speakeasy.generateSecret({ name: `Sahel (${email})` });
    const otpauth = secret.otpauth_url;
    const qr = await qrcode.toDataURL(otpauth);
    user.otpTempSecret = secret.base32;
    await writeUsers(users);
    res.json({ qr, secret: secret.base32 });
  } catch (e) {
    next(e);
  }
});

router.post('/2fa/verify', async (req, res, next) => {
  try {
    const { email, token } = req.body;
    const users = await readUsers();
    const user = users.find((u) => u.email === email);
    if (!user || !user.otpTempSecret) return res.status(400).json({ message: 'Setup not requested' });
    const verified = speakeasy.totp.verify({ secret: user.otpTempSecret, encoding: 'base32', token });
    if (!verified) return res.status(400).json({ message: 'Invalid token' });
    user.otpEnabled = true;
    user.otpSecret = user.otpTempSecret;
    delete user.otpTempSecret;
    await writeUsers(users);
    res.json({ message: '2FA enabled' });
  } catch (e) {
    next(e);
  }
});

module.exports = router;