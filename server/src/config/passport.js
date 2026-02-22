import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import env from './env.js';
import User from '../models/User.js';

// Local Strategy for username/email & password login
passport.use(new LocalStrategy({
    usernameField: 'identifier', // Can be email or username
    passwordField: 'password'
}, async (identifier, password, done) => {
    try {
        let user = await User.findOne({ where: { email: identifier.toLowerCase() } });
        if (!user) {
            user = await User.findOne({ where: { username: identifier } });
        }

        if (!user) {
            return done(null, false, { message: 'Invalid credentials' });
        }

        const isMatch = await user.validatePassword(password);
        if (!isMatch) {
            return done(null, false, { message: 'Invalid credentials' });
        }

        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

// JWT Strategy for protected routes
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: env.JWT_ACCESS_SECRET
};

passport.use(new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
    try {
        const user = await User.findByPk(jwtPayload.id);
        if (user) {
            return done(null, user);
        } else {
            return done(null, false, { message: 'User not found' });
        }
    } catch (err) {
        return done(err, false);
    }
}));

export default passport;
