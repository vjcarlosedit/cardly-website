import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  photo: z.string().optional(),
  plan: z.enum(['Gratis', 'Trimestral', 'Semestral', 'Anual']).optional(),
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
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

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = updateUserSchema.parse(req.body);
    const updateData: any = { ...data };

    // Hash password if provided
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: updateData,
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

    res.json(user);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update usage limits (internal use)
router.patch('/me/limits', authenticate, async (req: AuthRequest, res) => {
  try {
    const { generationsLeft, collectionsLeft } = req.body;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(generationsLeft !== undefined && { generationsLeft }),
        ...(collectionsLeft !== undefined && { collectionsLeft }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        photo: true,
        plan: true,
        generationsLeft: true,
        collectionsLeft: true,
      },
    });

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

