import express from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        plan: 'Gratis',
        generationsLeft: 15,
        collectionsLeft: 10,
      },
      select: {
        id: true,
        name: true,
        email: true,
        photo: true,
        plan: true,
        generationsLeft: true,
        collectionsLeft: true,
        createdAt: true,
      },
    });

    // Generate token
    const jwtSecret: string = process.env.JWT_SECRET || 'secret';
    const jwtExpiresIn: string = process.env.JWT_EXPIRES_IN || '7d';
    const signOptions: SignOptions = { expiresIn: jwtExpiresIn };
    const token = jwt.sign(
      { userId: user.id },
      jwtSecret,
      signOptions
    );

    res.status(201).json({
      user,
      token,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generate token
    const jwtSecret: string = process.env.JWT_SECRET || 'secret';
    const jwtExpiresIn: string = process.env.JWT_EXPIRES_IN || '7d';
    const signOptions: SignOptions = { expiresIn: jwtExpiresIn };
    const token = jwt.sign(
      { userId: user.id },
      jwtSecret,
      signOptions
    );

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        photo: user.photo,
        plan: user.plan,
        generationsLeft: user.generationsLeft,
        collectionsLeft: user.collectionsLeft,
      },
      token,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;

