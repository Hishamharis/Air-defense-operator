import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class MultiplayerRoom extends Model { }

MultiplayerRoom.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    code: {
        type: DataTypes.STRING(6),
        allowNull: false,
        unique: true
    },
    hostUserId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    maxPlayers: {
        type: DataTypes.INTEGER,
        defaultValue: 4
    },
    currentPlayers: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    currentSpectators: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    status: {
        type: DataTypes.ENUM('WAITING', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED'),
        defaultValue: 'WAITING'
    },
    faction: {
        type: DataTypes.STRING,
        allowNull: true
    },
    difficulty: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isPrivate: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: true
    },
    gameState: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    startedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    endedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'MultiplayerRoom'
});

export default MultiplayerRoom;
