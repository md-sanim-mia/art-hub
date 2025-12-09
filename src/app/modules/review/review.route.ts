import express from 'express';
import { ReviewController } from './review.contller';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';


const router = express.Router();

// Create a review
router.post('/',auth(UserRole.ADMIN,UserRole.SUPER_ADMIN,UserRole.USER), ReviewController.createReview);

// Get all reviews
router.get('/', ReviewController.getAllReviews);

// Get single review by ID
router.get('/:id',auth(UserRole.ADMIN,UserRole.SUPER_ADMIN,UserRole.USER), ReviewController.getReviewById);

// Update review by ID
router.patch('/:id', auth(UserRole.ADMIN,UserRole.SUPER_ADMIN,UserRole.USER),ReviewController.updateReview);

// Delete review by ID
router.delete('/:id',auth(UserRole.ADMIN,UserRole.SUPER_ADMIN,UserRole.USER), ReviewController.deleteReview);

export const reviewRoute = router;
