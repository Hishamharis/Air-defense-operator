import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class ChatMessage extends Model { }

ChatMessage.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    roomId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: true // System messages have null
    },
    content: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    isSystem: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    sequelize,
    modelName: 'ChatMessage'
});

export default ChatMessage;
