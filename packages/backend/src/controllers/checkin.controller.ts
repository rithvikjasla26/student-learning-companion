import { Request, Response, NextFunction } from 'express';
import { checkinService } from '../services/checkin.service.js';
import { llmService } from '../services/llm.service.js';
import { AuthError } from '../types/errors.js';

export const checkinController = {
  /**
   * Start a new check-in session
   */
  async startCheckIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthError('Unauthorized');
      }

      const topic = await checkinService.startCheckIn(req.user.userId);
      res.json(topic);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Submit explanation and get evaluation
   * Validation: Already done by validateBody middleware
   */
  async evaluateExplanation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthError('Unauthorized');
      }

      const { topicId, explanation } = req.body;
      const result = await checkinService.evaluateExplanation(
        req.user.userId,
        topicId,
        explanation
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get check-in history
   * Validation: Already done by validateQuery middleware
   */
  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthError('Unauthorized');
      }

      const limit = (req.query.limit as any) || 20;
      const offset = (req.query.offset as any) || 0;

      const result = await checkinService.getCheckInHistory(req.user.userId, limit, offset);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Upload and transcribe audio
   * Audio is optional - students can use text input instead
   */
  async uploadAudio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthError('Unauthorized');
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No audio file uploaded',
        });
        return;
      }

      // Transcribe the audio file
      const transcription = await llmService.transcribeAudio(req.file.path);

      res.json({
        success: true,
        file: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
        },
        transcription: {
          text: transcription.transcript,
          confidence: transcription.confidence,
          language: transcription.language,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
