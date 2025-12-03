import express from 'express';
import multer from 'multer';
import { createWorker } from 'tesseract.js';
import pdfParse from 'pdf-parse';
import fs from 'fs/promises';
import path from 'path';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Tipo de archivo inválido. Solo se permiten imágenes, PDFs y documentos.'));
    }
  },
});

// Extract text from file using OCR
router.post('/extract', authenticate, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    let extractedText = '';

    try {
      // Handle PDF files
      if (fileExtension === '.pdf') {
        const fileBuffer = await fs.readFile(filePath);
        const pdfData = await pdfParse(fileBuffer);
        extractedText = pdfData.text;
      }
      // Handle image files with OCR
      else if (['.jpg', '.jpeg', '.png'].includes(fileExtension)) {
        const worker = await createWorker('spa', 1, {
          logger: (m) => {
            // Solo loggear errores, no todo el progreso
            if (m.status === 'error') {
              console.error('OCR Error:', m);
            }
          },
        });
        
        // Configurar parámetros para mejorar la precisión
        // PSM 6: Uniform block of text (mejor para documentos con texto estructurado)
        // PSM 3: Fully automatic page segmentation (default, mejor para imágenes variadas)
        await worker.setParameters({
          tessedit_pageseg_mode: '3' as any, // Fully automatic page segmentation
          preserve_interword_spaces: '1', // Preservar espacios entre palabras
        });
        
        const { data: { text } } = await worker.recognize(filePath);
        
        await worker.terminate();
        
        // Limpiar el texto extraído de forma inteligente
        extractedText = text
          // Eliminar caracteres de control
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
          // Eliminar líneas decorativas (múltiples guiones, líneas, etc.)
          .replace(/[—_]{3,}/g, '') // Eliminar líneas de guiones bajos o guiones
          .replace(/[=]{3,}/g, '') // Eliminar líneas de iguales
          .replace(/[\.]{5,}/g, '') // Eliminar líneas de puntos
          // Eliminar caracteres extraños comunes del OCR
          // Usar una expresión regular más simple para evitar problemas de sintaxis
          .replace(/[^\w\sÁÉÍÓÚáéíóúÑñÀàÈèÌìÒòÙù.,;:!?()\-/@#$%&*+=<>|_~`^°¡¿\n]/g, '')
          // Normalizar espacios: múltiples espacios -> uno solo, pero preservar saltos de línea
          .replace(/[ \t]+/g, ' ')
          // Limpiar líneas que solo contienen caracteres especiales o están vacías
          .split('\n')
          .map((line: string) => {
            const trimmed = line.trim();
            // Eliminar líneas que solo tienen caracteres especiales o están casi vacías
            if (trimmed.length < 2 || /^[^\wÁÉÍÓÚáéíóúÑñÀàÈèÌìÒòÙù]+$/.test(trimmed)) {
              return '';
            }
            return trimmed;
          })
          .filter((line: string) => line.length > 0) // Eliminar líneas vacías
          .join('\n')
          // Máximo 2 saltos de línea consecutivos
          .replace(/\n{3,}/g, '\n\n')
          .trim();
      }
      // For other file types, return error
      else {
        await fs.unlink(filePath);
        return res.status(400).json({ error: 'Tipo de archivo no soportado para OCR' });
      }

      // Clean up uploaded file
      await fs.unlink(filePath);

      res.json({
        text: extractedText,
        length: extractedText.length,
      });
    } catch (error: any) {
      // Clean up file on error
      try {
        await fs.unlink(filePath);
      } catch {}
      
      throw error;
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al procesar el archivo' });
  }
});

export default router;

