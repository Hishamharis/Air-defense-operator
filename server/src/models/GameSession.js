import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class GameSession extends Model { }

GameSession.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
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
    waveReached: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    finalHp: {
        type: DataTypes.INTEGER,
        defaultValue: 100
    },
    totalThreatsSpawned: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    totalIntercepted: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    totalBreached: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    killRatio: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0
    },
    systemsExpendedCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    sessionDurationMs: {
        type: DataTypes.BIGINT,
        defaultValue: 0
    },
    isCompleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isMissionSuccess: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    difficultyModifier: {
        type: DataTypes.FLOAT,
        defaultValue: 1.0
    },
    peakWatchcon: {
        type: DataTypes.INTEGER,
        defaultValue: 4
    },
    highestWave: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    score: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    sequelize,
    modelName: 'GameSession',
    indexes: [
        { fields: ['userId'] },
        { fields: ['score'] },
        { fields: ['faction'] },
        { fields: ['difficulty'] },
        { fields: ['createdAt'] }
    ]
});

export default GameSession;
