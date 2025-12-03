import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

const createCollectionSchema = z.object({
  name: z.string().min(1),
});

const updateCollectionSchema = z.object({
  name: z.string().min(1).optional(),
  progress: z.number().min(0).max(100).optional(),
});

// Get all collections for user
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const collections = await prisma.collection.findMany({
      where: { userId: req.userId },
      include: {
        cards: true,
        _count: {
          select: { cards: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(collections);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single collection
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const collection = await prisma.collection.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      include: {
        cards: true,
      },
    });

    if (!collection) {
      return res.status(404).json({ error: 'Colección no encontrada' });
    }

    res.json(collection);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create collection
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name } = createCollectionSchema.parse(req.body);

    // Check user limits
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (user.plan === 'Gratis' && user.collectionsLeft <= 0) {
      return res.status(403).json({ error: 'Límite de colecciones alcanzado. Por favor, actualiza tu plan.' });
    }

    const collection = await prisma.collection.create({
      data: {
        name,
        userId: req.userId!,
      },
      include: {
        cards: true,
      },
    });

    // Decrease collections left if free plan
    if (user.plan === 'Gratis') {
      await prisma.user.update({
        where: { id: req.userId },
        data: {
          collectionsLeft: Math.max(0, user.collectionsLeft - 1),
        },
      });
    }

    res.status(201).json(collection);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update collection
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = updateCollectionSchema.parse(req.body);

    const collection = await prisma.collection.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!collection) {
      return res.status(404).json({ error: 'Colección no encontrada' });
    }

    const updated = await prisma.collection.update({
      where: { id: req.params.id },
      data,
      include: {
        cards: true,
      },
    });

    res.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete collection
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const collection = await prisma.collection.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!collection) {
      return res.status(404).json({ error: 'Colección no encontrada' });
    }

    // Obtener el usuario para verificar el plan
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    await prisma.collection.delete({
      where: { id: req.params.id },
    });

    // Si es plan Gratis, incrementar collectionsLeft (hasta el máximo de 10)
    if (user && user.plan === 'Gratis') {
      const updatedUser = await prisma.user.update({
        where: { id: req.userId },
        data: {
          collectionsLeft: Math.min(10, (user.collectionsLeft || 0) + 1),
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
      // Devolver el usuario actualizado en la respuesta
      res.json({ 
        message: 'Colección eliminada correctamente',
        user: updatedUser,
      });
    } else {
      res.json({ message: 'Colección eliminada correctamente' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

