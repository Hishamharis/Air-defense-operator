import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class AuditLog extends Model { }

AuditLog.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    actorUserId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    action: {
        type: DataTypes.STRING,
        allowNull: false
    },
    targetType: {
        type: DataTypes.STRING,
        allowNull: true
    },
    targetId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userAgent: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'AuditLog',
    indexes: [
        { fields: ['actorUserId'] },
        { fields: ['action'] },
        { fields: ['createdAt'] }
    ]
});

export default AuditLog;
