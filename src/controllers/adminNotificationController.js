const { AdminNotification, User, Company } = require('../models');
const { getCurrentUserId, getCurrentUserRole } = require('../utils/helpers');

class AdminNotificationController {
  // Get notifications for admin
  async getNotifications(req, res) {
    try {
      const userRole = getCurrentUserRole(req);

      if (userRole !== 'Admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const notifications = await AdminNotification.findAll({
        include: [
          {
            model: User,
            as: 'relatedUser',
            attributes: ['email'],
            required: false
          },
          {
            model: Company,
            as: 'relatedCompany',
            attributes: ['name', 'rfc'],
            required: false
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: 50
      });

      const notificationDtos = notifications.map(notif => ({
        id: notif.id,
        type: notif.notificationType,
        message: notif.message,
        userEmail: notif.relatedUser?.email || null,
        companyName: notif.relatedCompany?.name || null,
        companyRfc: notif.relatedCompany?.rfc || null,
        isRead: notif.isRead,
        createdAt: notif.createdAt
      }));

      return res.status(200).json(notificationDtos);
    } catch (error) {
      console.error('Get admin notifications error:', error);
      return res.status(500).json({ message: `An error occurred: ${error.message}` });
    }
  }

  // Mark notification as read
  async markAsRead(req, res) {
    try {
      const notificationId = parseInt(req.params.id);
      const userRole = getCurrentUserRole(req);

      if (userRole !== 'Admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const notification = await AdminNotification.findByPk(notificationId);

      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      notification.isRead = true;
      await notification.save();

      return res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
      console.error('Mark admin notification as read error:', error);
      return res.status(500).json({ message: `An error occurred: ${error.message}` });
    }
  }

  // Delete notification
  async deleteNotification(req, res) {
    try {
      const notificationId = parseInt(req.params.id);
      const userRole = getCurrentUserRole(req);

      if (userRole !== 'Admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      await AdminNotification.destroy({ where: { id: notificationId } });

      return res.status(200).json({ message: 'Notification deleted' });
    } catch (error) {
      console.error('Delete admin notification error:', error);
      return res.status(500).json({ message: `An error occurred: ${error.message}` });
    }
  }

  // Clear all notifications
  async clearAll(req, res) {
    try {
      const userRole = getCurrentUserRole(req);

      if (userRole !== 'Admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      await AdminNotification.destroy({ where: {} });

      return res.status(200).json({ message: 'All notifications cleared' });
    } catch (error) {
      console.error('Clear all admin notifications error:', error);
      return res.status(500).json({ message: `An error occurred: ${error.message}` });
    }
  }
}

module.exports = new AdminNotificationController();

