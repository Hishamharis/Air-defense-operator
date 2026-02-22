import User from './User.js';
import GameSession from './GameSession.js';
import Leaderboard from './Leaderboard.js';
import Replay from './Replay.js';
import Achievement from './Achievement.js';
import UserAchievement from './UserAchievement.js';
import MultiplayerRoom from './MultiplayerRoom.js';
import ChatMessage from './ChatMessage.js';
import BannedUser from './BannedUser.js';
import AuditLog from './AuditLog.js';

// User Associations
User.hasMany(GameSession, { foreignKey: 'userId' });
GameSession.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(UserAchievement, { foreignKey: 'userId' });
UserAchievement.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(ChatMessage, { foreignKey: 'userId' });
ChatMessage.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Leaderboard, { foreignKey: 'userId' });
Leaderboard.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Replay, { foreignKey: 'userId' });
Replay.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(MultiplayerRoom, { foreignKey: 'hostUserId' });
MultiplayerRoom.belongsTo(User, { as: 'host', foreignKey: 'hostUserId' });

// GameSession Associations
GameSession.hasOne(Replay, { foreignKey: 'gameSessionId' });
Replay.belongsTo(GameSession, { foreignKey: 'gameSessionId' });

GameSession.hasMany(Leaderboard, { foreignKey: 'gameSessionId' });
Leaderboard.belongsTo(GameSession, { foreignKey: 'gameSessionId' });

// Achievement Associations
Achievement.hasMany(UserAchievement, { foreignKey: 'achievementId' });
UserAchievement.belongsTo(Achievement, { foreignKey: 'achievementId' });

// MultiplayerRoom Associations
MultiplayerRoom.hasMany(ChatMessage, { foreignKey: 'roomId' });
ChatMessage.belongsTo(MultiplayerRoom, { foreignKey: 'roomId' });

import { sequelize } from '../config/database.js';

export {
    sequelize,
    User,
    GameSession,
    Leaderboard,
    Replay,
    Achievement,
    UserAchievement,
    MultiplayerRoom,
    ChatMessage,
    BannedUser,
    AuditLog
};
