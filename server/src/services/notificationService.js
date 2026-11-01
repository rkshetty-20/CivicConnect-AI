import Notification from '../models/Notification.js';
import { getIO } from '../config/socket.js';

/**
 * Creates a persisted notification in MongoDB and emits it in real-time
 * to the target user's personal socket room.
 *
 * @param {string} userId      - The recipient's User _id
 * @param {string} issueId     - The related Issue _id (optional)
 * @param {string} type        - Notification type enum
 * @param {string} message     - Human-readable notification message
 */
export const createNotification = async (userId, issueId, type, message) => {
  try {
    const notification = await Notification.create({
      user: userId,
      issue: issueId || null,
      type,
      message,
    });

    // Emit real-time event to the user's personal room
    try {
      const io = getIO();
      io.to(`user:${userId.toString()}`).emit('notification:new', {
        _id: notification._id,
        type: notification.type,
        message: notification.message,
        issueId: issueId,
        isRead: false,
        createdAt: notification.createdAt,
      });
    } catch (socketErr) {
      // Socket may not be initialized in test mode — non-fatal
      console.warn('[Notification] Socket emit skipped:', socketErr.message);
    }

    return notification;
  } catch (err) {
    console.error('[NotificationService] Error creating notification:', err.message);
  }
};

/**
 * Broadcasts a city-wide socket event (e.g. new issue posted)
 */
export const broadcastCityEvent = (eventName, payload) => {
  try {
    const io = getIO();
    io.to('city:all').emit(eventName, payload);
  } catch (err) {
    console.warn('[NotificationService] City broadcast skipped:', err.message);
  }
};
