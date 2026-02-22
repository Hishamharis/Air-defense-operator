import Queue from 'bull';
import env from '../config/env.js';
import logger from '../config/logger.js';
import nodemailer from 'nodemailer';

// Need to lazy-init transport to avoid circular deps or setup issues, though we can also just use it here
const emailQueue = new Queue('email-queue', {
    redis: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD || undefined,
        tls: env.REDIS_TLS ? {} : undefined
    }
});

class NotificationService {

    async queueEmail(emailData) {
        await emailQueue.add(emailData, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 60000 // 1m, 2m, 4m
            },
            removeOnComplete: true
        });
        logger.debug(`Email queued for ${emailData.to}`);
    }

    async processEmailQueue() {
        const transport = nodemailer.createTransport({
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            auth: {
                user: env.SMTP_USER,
                pass: env.SMTP_PASS
            }
        });

        emailQueue.process(async (job) => {
            const { to, subject, htmlBody, textBody } = job.data;
            return await this.sendEmail(transport, to, subject, htmlBody, textBody);
        });

        emailQueue.on('failed', (job, err) => {
            if (job.attemptsMade === job.opts.attempts) {
                logger.error(`Email sending perma-failed for ${job.data.to}`, err);
            }
        });
    }

    async sendEmail(transport, to, subject, htmlBody, textBody) {
        try {
            await transport.sendMail({
                from: env.SMTP_FROM,
                to,
                subject,
                text: textBody,
                html: htmlBody
            });
            logger.info(`Email sent successfully to ${to}`);
        } catch (err) {
            logger.error(`Failed to send email to ${to}: ${err.message}`);
            throw err;
        }
    }

    renderEmailTemplate(templateName, variables) {
        // Very simple inline HTML templates
        const baseStyles = `font-family: monospace; color: #a3e635; background-color: #020617; padding: 20px; border: 1px solid #4d7c0f;`;
        const container = (content) => `<div style="${baseStyles}"><h2>AIR DEFENSE COMMAND</h2><hr style="border-color: #4d7c0f;">${content}<br/><br/><small>AUTO-GENERATED COMMS. DO NOT REPLY.</small></div>`;

        if (templateName === 'verify-email') {
            return container(`<p>OPERATOR ${variables.username},</p><p>Please verify your comms link:</p><a href="${variables.link}" style="color: #65a30d;">VERIFY NOW</a>`);
        }
        if (templateName === 'password-reset') {
            return container(`<p>OPERATOR ${variables.username},</p><p>A command reset was requested. Authorized link:</p><a href="${variables.link}" style="color: #65a30d;">RESET PASSWORD</a>`);
        }
        if (templateName === 'welcome') {
            return container(`<p>WELCOME TO ACTIVE DUTY, OPERATOR ${variables.username}.</p><p>Prepare for deployment.</p>`);
        }
        if (templateName === 'achievement-unlocked') {
            return container(`<p>OPERATOR ${variables.username},</p><p>COMMENDATION AWARDED: <strong>${variables.achievementName}</strong></p><p><em>${variables.achievementDesc}</em></p>`);
        }

        return container(`<p>System message. Error finding template.</p>`);
    }
}

export default new NotificationService();
