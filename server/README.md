# Air Defense Command Server

Production-ready backend for the Air Defense Command simulation.

## Prerequisites
- Node.js 20 LTS
- PostgreSQL 15
- Redis 7

## Installation
1. `npm install`
2. `cp .env.example .env` (and fill in the appropriate variables)
3. `npm start` (or `npm run dev` for nodemon)

## Architecture Overview
This application uses Express.js for the HTTP layer and Socket.IO for real-time multiplayer/events. 
- **Middlewares** intercept requests for authentication (Passport JWT), validation (Express-Validator), and security (Helmet, Rate Limiter).
- **Controllers** extract request parameters and orchestrate service calls.
- **Services** contain core business logic, calling the database (Sequelize models) and Redis (caching and pub/sub).
- **Jobs** run in Bull queues backed by Redis to handle async work like leaderboard syncs and achievement processing.

## API Documentation Summary
### Auth
- `POST /api/auth/register` (Public) - Register a new account
- `POST /api/auth/login` (Public) - Login
- `POST /api/auth/refresh` (Public) - Refresh access token
- `POST /api/auth/logout` (Public) - Logout
- `GET /api/auth/me` (Auth) - Get current user

### Users
- `GET /api/users` (Admin) - List all users
- `GET /api/users/:id` (Auth) - Get user profile
- `PATCH /api/users/:id` (Auth/Admin) - Update user

*(Other endpoints for sessions, stats, replays, multiplayer follow the same standard REST patterns).*

## WebSockets
- Connection requires JWT token in handsake auth.
- Standard events: `join-room`, `leave-room`, `start-game`, `sync-game-state`.

## Deployment
Set `NODE_ENV=production`. Ensure PostgreSQL and Redis are secured and accessible. Run behind an Nginx or HAProxy load balancer with SSL termination. PM2 or Docker is recommended for process management.
