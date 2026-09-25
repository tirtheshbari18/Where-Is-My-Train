import { Request, Response } from 'express';

interface UserFeedback {
  id: string;
  type: 'ISSUE' | 'FEATURE' | 'GENERAL' | 'RATING';
  name?: string;
  email?: string;
  message: string;
  rating?: number;
  submittedAt: string;
}

const feedbackStore: UserFeedback[] = [];

export class FeedbackController {
  static submitFeedback(req: Request, res: Response) {
    const { type, name, email, message, rating } = req.body;
    if (!message && !rating) {
      return res.status(400).json({ success: false, error: 'Message or rating is required.' });
    }

    const item: UserFeedback = {
      id: `fb_${Date.now()}`,
      type: type || 'GENERAL',
      name: name || 'Anonymous Passenger',
      email,
      message: message || `User rating: ${rating} stars`,
      rating,
      submittedAt: new Date().toISOString(),
    };

    feedbackStore.unshift(item);

    res.json({
      success: true,
      message: 'Thank you for your feedback! It helps improve Where Is My Train.',
      data: item,
    });
  }
}
