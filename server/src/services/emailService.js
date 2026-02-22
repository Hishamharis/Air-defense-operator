import nodemailer from 'nodemailer';
import env from '../config/env.js';
import logger from '../config/logger.js';
import notificationService from './notificationService.js';

class EmailService {
    createTransport() {
        return nodemailer.createTransport({
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            auth: {
                user: env.SMTP_USER,
                pass: env.SMTP_PASS
            }
        });
    }

    async sendVerificationEmail(user, token) {
        const link = `${env.CLIENT_URL}/verify-email?token=${token}`;
        const html = notificationService.renderEmailTemplate('verify-email', { username: user.username, link });
        const text = `Hello ${user.username},\nPlease verify your email by visiting: ${link}`;

        await notificationService.queueEmail({
            to: user.email,
            subject: '[AIR DEFENSE COMMAND] Verify Your Communications Link',
            htmlBody: html,
            textBody: text
        });
    }

    async sendPasswordResetEmail(user, token) {
        const link = `${env.CLIENT_URL}/reset-password?token=${token}`;
        const html = notificationService.renderEmailTemplate('password-reset', { username: user.username, link });
        const text = `Hello ${user.username},\nYou requested a password reset. Authorized link: ${link}`;

        await notificationService.queueEmail({
            to: user.email,
            subject: '[AIR DEFENSE COMMAND] Command Access Reset Request',
            htmlBody: html,
            textBody: text
        });
    }

    async sendAchievementEmail(user, achievement) {
        const html = notificationService.renderEmailTemplate('achievement-unlocked', {
            username: user.username,
            achievementName: achievement.name,
            achievementDesc: achievement.description
        });
        const text = `Congratulations ${user.username}! You unlocked: ${achievement.name} - ${achievement.description}`;

        await notificationService.queueEmail({
            to: user.email,
            subject: `[AIR DEFENSE COMMAND] Achievement Unlocked: ${achievement.name}`,
            htmlBody: html,
            textBody: text
        });
    }

    async sendWelcomeEmail(user) {
        const html = notificationService.renderEmailTemplate('welcome', { username: user.username });
        const text = `Welcome to Air Defense Command, operator ${user.username}.`;

        await notificationService.queueEmail({
            to: user.email,
            subject: '[AIR DEFENSE COMMAND] Welcome to Active Duty',
            htmlBody: html,
            textBody: text
        });
    }
}

export default new EmailService();
