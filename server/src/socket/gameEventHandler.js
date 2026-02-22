import logger from '../config/logger.js';

export default (io, socket) => {

    // Broadcast high-frequency game state to all room members
    socket.on('sync-game-state', (data) => {
        // Normally only host should emit this, could validate but keeping fast
        socket.to(`room:${data.code}`).emit('game-state-update', data.state);
    });

    // Threat updates
    socket.on('threat-update', (data) => {
        socket.to(`room:${data.code}`).emit('threat-positions', data.threats);
    });

    // Interception events
    socket.on('intercept-event', (data) => {
        // e.g. "player X fired patriot at threat Y"
        io.to(`room:${data.code}`).emit('intercept-fired', {
            userId: socket.user.id,
            ...data
        });

        // After calculation (mocked or from host):
        // io.to(`room:${data.code}`).emit('intercept-result', result);
    });

    // Breach events
    socket.on('breach-event', (data) => {
        io.to(`room:${data.code}`).emit('asset-damaged', {
            damage: data.damage,
            threatId: data.threatId
        });
    });

    // Wave transitions
    socket.on('wave-start', (data) => {
        io.to(`room:${data.code}`).emit('wave-started', { wave: data.wave });
    });

    socket.on('wave-complete', (data) => {
        io.to(`room:${data.code}`).emit('wave-completed', { wave: data.wave });
    });

    // Game Over
    socket.on('game-over', (data) => {
        io.to(`room:${data.code}`).emit('game-ended', {
            finalStats: data.stats,
            isVictory: data.isVictory
        });
    });

    // Scoring
    socket.on('player-score-update', (data) => {
        io.to(`room:${data.code}`).emit('score-changed', {
            userId: socket.user.id,
            score: data.score
        });
    });
};
