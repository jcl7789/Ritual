
import { Router } from 'express';
import { ping } from '../controllers/healthController';

const router = Router();

router.get('/ping', ping)

export default router;
