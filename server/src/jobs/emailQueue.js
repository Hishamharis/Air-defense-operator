import notificationService from '../services/notificationService.js';

// Initialization of processor
notificationService.processEmailQueue();

export default {}; // Re-export if needed, queue instance is accessed internally via the service
