import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/hashUtils.js';

class User extends Model {
    async validatePassword(plaintext) {
        return await comparePassword(plaintext, this.passwordHash);
    }

    toPublicJSON() {
        const values = { ...this.get() };
        delete values.passwordHash;
        delete values.emailVerificationToken;
        delete values.passwordResetToken;
        return values;
    }
}

User.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { len: [3, 24] }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
    },
    passwordHash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('PLAYER', 'MODERATOR', 'ADMIN'),
        defaultValue: 'PLAYER'
    },
    isEmailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    emailVerificationToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    emailVerificationExpiry: {
        type: DataTypes.DATE,
        allowNull: true
    },
    passwordResetToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    passwordResetExpiry: {
        type: DataTypes.DATE,
        allowNull: true
    },
    isBanned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    banReason: {
        type: DataTypes.STRING,
        allowNull: true
    },
    banExpiry: {
        type: DataTypes.DATE,
        allowNull: true
    },
    lastLoginAt: {
        type: DataTypes.DATE
    },
    lastLoginIp: {
        type: DataTypes.STRING
    },
    loginCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    totalGamesPlayed: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    totalWins: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    totalKills: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    totalBreaches: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    totalWavesCompleted: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    preferredFaction: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'User',
    hooks: {
        beforeCreate: async (user) => {
            if (user.passwordHash) {
                user.passwordHash = await hashPassword(user.passwordHash);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('passwordHash')) {
                user.passwordHash = await hashPassword(user.passwordHash);
            }
        }
    }
});

// Associations will be defined centrally later or inline if using export patterns
// User.hasMany(GameSession);
// User.hasMany(UserAchievement);
// User.hasMany(ChatMessage);

export default User;
