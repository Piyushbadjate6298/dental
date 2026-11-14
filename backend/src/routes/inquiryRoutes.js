import { Router } from 'express';
import * as inquiryController from '../controllers/inquiryController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { schemas } from '../validators/schemas.js';

const router = Router();

// Submitting new inquiry is permitted from frontend inquiry form
router.post('/', validate(schemas.inquiry), inquiryController.createInquiry);

// Inquiry list, view, update, delete require authentication to safeguard patient privacy
router.get('/', authMiddleware, inquiryController.getInquiries);
router.get('/:id', authMiddleware, inquiryController.getInquiryById);
router.put('/:id', authMiddleware, validate(schemas.inquiry), inquiryController.updateInquiry);
router.delete('/:id', authMiddleware, inquiryController.deleteInquiry);

export default router;
