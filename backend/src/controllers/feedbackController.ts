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

// NOTE: feedback is intentionally NOT accumulated in a process-wide array.
// Server-side global collections would leak one user's data to every other user
// (multi-user safety) and would not survive a restart. Only a redacted audit line is logged.

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

    // Server-side audit log only (no personal details).
    console.log(
      `[Feedback] ${item.type} received at ${item.submittedAt}${
        typeof item.rating === 'number' ? ` rating=${item.rating}` : ''
      }`
    );

    res.json({
      success: true,
      message: 'Thank you for your feedback! It helps improve Where Is My Train.',
      data: item,
    });
  }
}
