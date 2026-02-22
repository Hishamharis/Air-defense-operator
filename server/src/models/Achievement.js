import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Achievement extends Model { }

Achievement.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false
    },
    iconKey: {
        type: DataTypes.STRING,
        allowNull: false
    },
    category: {
        type: DataTypes.ENUM('COMBAT', 'SURVIVAL', 'EFFICIENCY', 'FACTION', 'MILESTONES', 'SECRETS'),
        allowNull: false
    },
    rarity: {
        type: DataTypes.ENUM('COMMON', 'RARE', 'EPIC', 'LEGENDARY'),
        allowNull: false
    },
    pointValue: {
        type: DataTypes.INTEGER,
        defaultValue: 10
    },
    triggerCondition: {
        type: DataTypes.JSONB,
        allowNull: false
    },
    isHidden: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    sequelize,
    modelName: 'Achievement'
});

export default Achievement;
