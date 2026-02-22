import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class UserAchievement extends Model { }

UserAchievement.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    achievementId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    unlockedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    gameSessionId: {
        type: DataTypes.UUID,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'UserAchievement',
    indexes: [
        { fields: ['userId', 'achievementId'], unique: true }
    ]
});

export default UserAchievement;
