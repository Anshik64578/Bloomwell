const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/User');
const verifyToken = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

const signupSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email });

router.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const { name, email, password } = signupSchema.parse(req.body);

    if (await User.exists({ email })) {
      return res.status(409).json({ message: 'An account with that email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });

    res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email }).select('+passwordHash');
    const ok = user && (await bcrypt.compare(password, user.passwordHash));
    if (!ok) {
      // Same message for unknown email and wrong password
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({ token: signToken(user._id), user: publicUser(user) });
  })
);

router.get(
  '/me',
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ message: 'Account no longer exists' });
    res.json({ user: publicUser(user) });
  })
);

module.exports = router;
