import express from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/authController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticate } from '../middleware/authenticate.js';
import { authLimiter } from '../config/rateLimiter.js';
import { checkBan } from '../middleware/checkBan.js';

const router = express.Router();

router.post('/register', authLimiter, [
    body('username').isString().isLength({ min: 3, max: 24 }).withMessage('Username must be 3-24 characters'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) throw new Error('Passwords do not match');
        return true;
    }),
    validateRequest
], authController.register);

router.post('/login', authLimiter, [
    body('identifier').notEmpty().withMessage('Email or username is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validateRequest
], authController.login); // Note: passport local strategy applied inside controller or via middleware if preferred. We'll use passport middleware here.

import passport from 'passport';
router.post('/login', authLimiter, passport.authenticate('local', { session: false }), checkBan, authController.login);

router.post('/refresh', authController.refresh);

router.post('/logout', authController.logout);

router.post('/verify-email', [
    body('token').notEmpty().withMessage('Token required'),
    validateRequest
], authController.verifyEmail);

router.post('/resend-verification', [
    body('email').isEmail(),
    validateRequest
], authController.resendVerification);

router.post('/forgot-password', [
    body('email').isEmail(),
    validateRequest
], authController.forgotPassword);

router.post('/reset-password', [
    body('token').notEmpty(),
    body('newPassword').isLength({ min: 8 }),
    validateRequest
], authController.resetPassword);

router.get('/me', authenticate, authController.me);

export default router;
