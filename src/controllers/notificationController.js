const { Notification, User } = require('../models');
const { getCurrentUserRole } = require('../utils/helpers');

class NotificationController {
  async getNotifications(req, res) {
    try {
      console.log('[NotificationController] 📥 GET /api/notification called');
      
      const userRole = getCurrentUserRole(req);
      console.log(`[NotificationController] User role: ${userRole}`);

      if (userRole !== 'Admin') {
        console.log('[NotificationController] ❌ Access denied: User is not admin');
        return res.status(403).json({ message: 'Forbidden' });
      }

      const notifications = await Notification.findAll({
        include: [{
          model: User,
          as: 'clientUser',
          attributes: ['email']
        }],
        order: [['sentAt', 'DESC']],
        limit: 50
      });

      const notificationDtos = notifications.map(n => ({
        id: n.id,
        documentCount: n.documentCount,
        sentAt: n.sentAt.toISOString(),
        clientEmail: n.clientUser ? n.clientUser.email : 'Unknown',
        read: n.isRead
      }));

      console.log(`[NotificationController] ✅ Returning ${notificationDtos.length} notifications`);

      return res.status(200).json(notificationDtos);
    } catch (error) {
      console.error('Get notifications error:', error);
      return res.status(500).json({ message: `An error occurred: ${error.message}` });
    }
  }

  async markAsRead(req, res) {
    try {
      const userRole = getCurrentUserRole(req);
      
      if (userRole !== 'Admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const id = parseInt(req.params.id);
      const notification = await Notification.findByPk(id);

      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      notification.isRead = true;
      await notification.save();

      return res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
      console.error('Mark as read error:', error);
      return res.status(500).json({ message: `An error occurred: ${error.message}` });
    }
  }

  async clearAll(req, res) {
    try {
      const userRole = getCurrentUserRole(req);
      
      if (userRole !== 'Admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      await Notification.destroy({ where: {} });

      return res.status(200).json({ message: 'All notifications cleared' });
    } catch (error) {
      console.error('Clear all error:', error);
      return res.status(500).json({ message: `An error occurred: ${error.message}` });
    }
  }

  async deleteNotification(req, res) {
    try {
      const userRole = getCurrentUserRole(req);
      
      if (userRole !== 'Admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const id = parseInt(req.params.id);
      const notification = await Notification.findByPk(id);

      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      await notification.destroy();

      return res.status(200).json({ message: 'Notification deleted' });
    } catch (error) {
      console.error('Delete notification error:', error);
      return res.status(500).json({ message: `An error occurred: ${error.message}` });
    }
  }
}

module.exports = new NotificationController();

