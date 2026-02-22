import { ChatMessage } from '../models/index.js';
import logger from '../config/logger.js';

export default (io, socket) => {
    socket.on('send-message', async (data, callback) => {
        try {
            const { code, content } = data;

            // Validate length
            if (!content || content.length > 500) {
                if (callback) callback({ success: false, error: 'Message too long or empty' });
                return;
            }

            // Basic sanitize mapping DOMPurify would run on frontend, server strips tags simply
            const sanitized = content.replace(/</g, "&lt;").replace(/>/g, "&gt;");

            // Normally look up roomId via code, mocked here for direct insert
            const roomId = data.roomId || null;

            const msg = await ChatMessage.create({
                roomId,
                userId: socket.user.id,
                content: sanitized,
                isSystem: false
            });

            io.to(`room:${code}`).emit('new-message', {
                id: msg.id,
                userId: socket.user.id,
                content: sanitized,
                createdAt: msg.createdAt
            });

            if (callback) callback({ success: true });
        } catch (err) {
            logger.error(`Chat error: ${err.message}`);
            if (callback) callback({ success: false, error: 'Server error parsing chat' });
        }
    });

    // A helper method for server system messages (not bound to socket event)
    // Could export this separately if needed by services
};
