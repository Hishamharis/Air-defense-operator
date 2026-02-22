import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Leaderboard extends Model { }

Leaderboard.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    gameSessionId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    faction: {
        type: DataTypes.STRING,
        allowNull: false
    },
    difficulty: {
        type: DataTypes.STRING,
        allowNull: false
    },
    score: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    killRatio: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0
    },
    waveReached: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    rank: {
        type: DataTypes.INTEGER,
        allowNull: true // Computed dynamically
    },
    period: {
        type: DataTypes.ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'ALLTIME'),
        allowNull: false
    },
    periodKey: {
        type: DataTypes.STRING, // e.g. 2024-W12
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'Leaderboard',
    indexes: [
        { fields: ['period', 'periodKey', 'score'] }
    ]
});

export default Leaderboard;
