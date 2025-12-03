import express from 'express';
import axios from 'axios';
import { authenticate, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

const generateCardsSchema = z.object({
  text: z.string().min(10),
  collectionId: z.string(),
  numCards: z.number().min(1).max(30).default(5),
  difficulty: z.enum(['facil', 'media', 'dificil']).default('media'),
  collectionName: z.string().min(1),
});

// Generate flashcards using DeepSeek API
router.post('/generate-cards', authenticate, async (req: AuthRequest, res) => {
  try {
    const { text, collectionId, numCards, difficulty, collectionName } = generateCardsSchema.parse(req.body);

    // Check user limits
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (user.plan === 'Gratis' && user.generationsLeft <= 0) {
      return res.status(403).json({ error: 'Límite de generaciones alcanzado. Por favor, actualiza tu plan.' });
    }

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

    // Prepare prompt based on difficulty with specific word limits
    const difficultyConfig = {
      facil: {
        description: 'conceptos básicos y definiciones simples',
        frontMaxWords: 10,
        backMaxWords: 5,
        instructions: 'El "front" debe ser una pregunta simple o concepto básico (máximo 10 palabras). El "back" debe ser una respuesta muy breve y directa (máximo 5 palabras). Ejemplo: Front: "¿Qué es X?" Back: "X es Y"'
      },
      media: {
        description: 'conceptos intermedios y relaciones entre ideas',
        frontMaxWords: 15,
        backMaxWords: 15,
        instructions: 'El "front" debe ser una pregunta o concepto intermedio (máximo 15 palabras). El "back" debe ser una explicación en una sola frase completa (máximo 15 palabras). Ejemplo: Front: "¿Cómo funciona X?" Back: "X funciona mediante Y porque Z"'
      },
      dificil: {
        description: 'conceptos avanzados, análisis profundo y aplicaciones complejas',
        frontMaxWords: 20,
        backMaxWords: 25,
        instructions: 'El "front" debe ser una pregunta compleja o concepto avanzado (máximo 20 palabras). El "back" debe ser una explicación detallada con análisis profundo (máximo 25 palabras). Ejemplo: Front: "¿Cuál es la relación entre X e Y y cómo se aplica en Z?" Back: "La relación entre X e Y se basa en A, B y C, lo cual permite aplicaciones en Z mediante D y E"'
      },
    };

    const config = difficultyConfig[difficulty as keyof typeof difficultyConfig];

    const prompt = `Eres un experto en crear tarjetas de estudio educativas. Basándote en el siguiente texto, genera exactamente ${numCards} tarjetas de estudio de dificultad ${config.description}.

Texto de referencia:
${text}

Formato de respuesta (JSON array):
[
  {
    "front": "Pregunta o concepto",
    "back": "Respuesta o explicación"
  }
]

REGLAS ESTRICTAS DE DIFICULTAD (${difficulty.toUpperCase()}):
${config.instructions}

IMPORTANTE:
- Genera exactamente ${numCards} tarjetas
- Cada tarjeta debe ser clara y educativa
- RESPETA ESTRICTAMENTE los límites de palabras: Front máximo ${config.frontMaxWords} palabras, Back máximo ${config.backMaxWords} palabras
- Las tarjetas deben cubrir los conceptos más importantes del texto
- Responde SOLO con el JSON array, sin texto adicional ni explicaciones fuera del JSON`;

    // Call DeepSeek API
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
    
    if (!apiKey) {
      console.error('DEEPSEEK_API_KEY no está configurada');
      return res.status(500).json({ error: 'API key de DeepSeek no configurada' });
    }
    
    console.log('Llamando a DeepSeek API...', { apiUrl, hasApiKey: !!apiKey, numCards, difficulty });
    
    const deepseekResponse = await axios.post(
      apiUrl,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente experto en crear contenido educativo. Siempre respondes en formato JSON válido.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );
    
    console.log('Respuesta de DeepSeek recibida');

    // Parse response
    const aiResponse = deepseekResponse.data.choices[0].message.content;
    console.log('Respuesta de IA recibida, longitud:', aiResponse.length);
    let cards: Array<{ front: string; back: string }> = [];

    try {
      // Try to extract JSON from response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        cards = JSON.parse(jsonMatch[0]);
        console.log('Tarjetas parseadas desde JSON match:', cards.length);
      } else {
        // Fallback: try to parse the whole response
        cards = JSON.parse(aiResponse);
        console.log('Tarjetas parseadas desde respuesta completa:', cards.length);
      }
    } catch (parseError) {
      // If parsing fails, create cards manually from the response
      console.error('Error parsing AI response:', parseError);
      console.error('Respuesta raw (primeros 500 caracteres):', aiResponse.substring(0, 500));
      return res.status(500).json({ 
        error: 'Error al procesar la respuesta de la IA. Por favor, intenta de nuevo.',
        rawResponse: aiResponse.substring(0, 500) 
      });
    }

    // Validate cards structure
    if (!Array.isArray(cards) || cards.length === 0) {
      return res.status(500).json({ error: 'Formato de tarjetas inválido de la IA' });
    }

    // Limit to requested number
    cards = cards.slice(0, numCards);

    // Save cards to database
    const createdCards = await prisma.card.createMany({
      data: cards.map(card => ({
        collectionId,
        front: card.front,
        back: card.back,
      })),
    });

    // Decrease generations left if free plan
    if (user.plan === 'Gratis') {
      await prisma.user.update({
        where: { id: req.userId },
        data: {
          generationsLeft: Math.max(0, user.generationsLeft - 1),
        },
      });
    }

    // Get all cards for the collection
    const allCards = await prisma.card.findMany({
      where: { collectionId },
    });

    res.json({
      cards: allCards,
      generated: createdCards.count,
      message: 'Tarjetas generadas exitosamente',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    
    if (error.response) {
      // DeepSeek API error
      return res.status(error.response.status).json({
        error: 'Error al llamar a la API de DeepSeek',
        details: error.response.data,
      });
    }

    res.status(500).json({ error: error.message || 'Error al generar tarjetas' });
  }
});

export default router;

