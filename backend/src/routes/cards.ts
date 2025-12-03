import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

const createCardSchema = z.object({
  collectionId: z.string(),
  front: z.string().min(1),
  back: z.string().min(1),
});

const updateCardSchema = z.object({
  front: z.string().min(1).optional(),
  back: z.string().min(1).optional(),
});

const reviewCardSchema = z.object({
  quality: z.enum(['again', 'hard', 'good', 'easy']),
});

const createMultipleCardsSchema = z.object({
  collectionId: z.string(),
  cards: z.array(z.object({
    front: z.string().min(1),
    back: z.string().min(1),
  })),
});

// Get all cards for a collection
router.get('/collection/:collectionId', authenticate, async (req: AuthRequest, res) => {
  try {
    // Verify collection belongs to user
    const collection = await prisma.collection.findFirst({
      where: {
        id: req.params.collectionId,
        userId: req.userId,
      },
    });

    if (!collection) {
      return res.status(404).json({ error: 'Colección no encontrada' });
    }

    const cards = await prisma.card.findMany({
      where: { collectionId: req.params.collectionId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(cards);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get cards ready for review (spaced repetition)
router.get('/collection/:collectionId/review', authenticate, async (req: AuthRequest, res) => {
  try {
    // Verify collection belongs to user
    const collection = await prisma.collection.findFirst({
      where: {
        id: req.params.collectionId,
        userId: req.userId,
      },
    });

    if (!collection) {
      return res.status(404).json({ error: 'Colección no encontrada' });
    }

    const now = new Date();
    
    // Get cards that are ready for review (nextReviewDate is null or <= now)
    const cards = await prisma.card.findMany({
      where: {
        collectionId: req.params.collectionId,
        OR: [
          { nextReviewDate: null },
          { nextReviewDate: { lte: now } },
        ],
      },
      orderBy: [
        { nextReviewDate: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    res.json(cards);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create single card
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { collectionId, front, back } = createCardSchema.parse(req.body);

    // Verify collection belongs to user
    const collection = await prisma.collection.findFirst({
      where: {
        id: collectionId,
        userId: req.userId,
      },
    });

    if (!collection) {
      return res.status(404).json({ error: 'Colección no encontrada' });
    }

    const card = await prisma.card.create({
      data: {
        collectionId,
        front,
        back,
      },
    });

    res.status(201).json(card);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Create multiple cards
router.post('/bulk', authenticate, async (req: AuthRequest, res) => {
  try {
    const { collectionId, cards } = createMultipleCardsSchema.parse(req.body);

    // Verify collection belongs to user
    const collection = await prisma.collection.findFirst({
      where: {
        id: collectionId,
        userId: req.userId,
      },
    });

    if (!collection) {
      return res.status(404).json({ error: 'Colección no encontrada' });
    }

    const createdCards = await prisma.card.createMany({
      data: cards.map(card => ({
        collectionId,
        front: card.front,
        back: card.back,
      })),
    });

    // Get all cards for the collection
    const allCards = await prisma.card.findMany({
      where: { collectionId },
    });

    res.status(201).json({ count: createdCards.count, cards: allCards });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update card
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = updateCardSchema.parse(req.body);

    // Verify card belongs to user's collection
    const card = await prisma.card.findFirst({
      where: { id: req.params.id },
      include: {
        collection: true,
      },
    });

    if (!card || card.collection.userId !== req.userId) {
      return res.status(404).json({ error: 'Tarjeta no encontrada' });
    }

    const updated = await prisma.card.update({
      where: { id: req.params.id },
      data,
    });

    res.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Review card (update spaced repetition data)
router.post('/:id/review', authenticate, async (req: AuthRequest, res) => {
  try {
    const { quality } = reviewCardSchema.parse(req.body);

    // Verify card belongs to user's collection
    const card = await prisma.card.findFirst({
      where: { id: req.params.id },
      include: {
        collection: true,
      },
    });

    if (!card || card.collection.userId !== req.userId) {
      return res.status(404).json({ error: 'Tarjeta no encontrada' });
    }

    // SM-2 Algorithm (simplified)
    let newInterval = 0;
    let newEaseFactor = card.easeFactor || 2.5;
    let newRepetitions = card.repetitions || 0;
    const now = new Date();

    if (quality === 'again') {
      // Reset card - revisar en 1 minuto
      newInterval = 1; // 1 minute
      newEaseFactor = Math.max(1.3, newEaseFactor - 0.2);
      newRepetitions = 0;
    } else if (quality === 'hard') {
      // Hard: reducir ease factor ligeramente
      newEaseFactor = Math.max(1.3, newEaseFactor - 0.15);
      if (newRepetitions === 0) {
        newInterval = 5; // 5 minutos
      } else {
        newInterval = Math.max(5, Math.round((card.interval || 0) * 1.2));
      }
      newRepetitions = newRepetitions + 1;
    } else if (quality === 'good') {
      // Good: progresión normal
      if (newRepetitions === 0) {
        newInterval = 10; // 10 minutos
      } else {
        newInterval = Math.round((card.interval || 0) * newEaseFactor);
      }
      newRepetitions = newRepetitions + 1;
    } else if (quality === 'easy') {
      // Easy: aumentar ease factor e intervalo más largo
      newEaseFactor = newEaseFactor + 0.15;
      if (newRepetitions === 0) {
        newInterval = 5760; // 4 días (4 * 24 * 60 = 5760 minutos)
      } else {
        newInterval = Math.round((card.interval || 0) * newEaseFactor * 1.3);
      }
      newRepetitions = newRepetitions + 1;
    }

    // Calcular fecha de próxima revisión
    const nextReviewDate = new Date(now.getTime() + newInterval * 60 * 1000);

    // Actualizar tarjeta
    const updated = await prisma.card.update({
      where: { id: req.params.id },
      data: {
        interval: newInterval,
        easeFactor: newEaseFactor,
        repetitions: newRepetitions,
        nextReviewDate: nextReviewDate,
      },
    });

    res.json({
      card: updated,
      nextReviewIn: newInterval,
      nextReviewDate: nextReviewDate,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete card
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    // Verify card belongs to user's collection
    const card = await prisma.card.findFirst({
      where: { id: req.params.id },
      include: {
        collection: true,
      },
    });

    if (!card || card.collection.userId !== req.userId) {
      return res.status(404).json({ error: 'Tarjeta no encontrada' });
    }

    await prisma.card.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Tarjeta eliminada correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

