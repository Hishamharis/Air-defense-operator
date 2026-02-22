import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Replay extends Model { }

Replay.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    gameSessionId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    fileSize: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    durationMs: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    frameCount: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    compressionType: {
        type: DataTypes.STRING,
        defaultValue: 'gzip'
    },
    storageKey: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isPublic: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    viewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    downloadCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    sequelize,
    modelName: 'Replay'
});

export default Replay;
