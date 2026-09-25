import { Router } from 'express';
import { PlatformVotesController } from '../controllers/platformVotesController.js';

const router = Router();

router.get('/:trainNumber/:stationCode', PlatformVotesController.getVotes);
router.post('/', PlatformVotesController.submitVote);

export default router;
