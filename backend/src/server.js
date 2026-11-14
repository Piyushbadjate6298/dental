import app from './app.js';
import { testConnection } from './database/connection.js';
import { seedInitialAdminIfNeeded } from './services/authService.js';
import { logger } from './utils/logger.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // 1. Check database connectivity
    const dbStatus = await testConnection();
    logger.info(`Database mode: [${dbStatus.mode}] - ${dbStatus.message}`);

    // 2. Ensure initial admin user exists
    await seedInitialAdminIfNeeded();

    // 3. Start HTTP server
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🦷 Shital Dental Services Backend API running on port ${PORT}`);
      logger.info(`Local API URL: http://localhost:${PORT}/api`);
      logger.info(`Health check:  http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();
