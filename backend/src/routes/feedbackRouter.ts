import { Router } from 'express';
import { FeedbackController } from '../controllers/feedbackController.js';

const router = Router();

router.post('/', FeedbackController.submitFeedback);

export default router;
