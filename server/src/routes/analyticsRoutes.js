import { Router } from 'express'
import { trackVisit, getAnalytics } from '../controllers/analyticsController.js'
import authMiddleware from '../middlewares/authMiddleware.js'
import { requireRole } from '../middlewares/roleMiddleware.js'

const router = Router()

router.post('/track', trackVisit)
router.get('/summary', authMiddleware, requireRole('superadmin'), getAnalytics)

export default router