const { CompanyNotification, User, Company } = require('../models');
const { getCurrentUserId, getCurrentUserRole } = require('../utils/helpers');
const { Op } = require('sequelize');

class CompanyNotificationController {
  // Get notifications for logged-in company
  async getNotifications(req, res) {
    try {
      const userRole = getCurrentUserRole(req);
      const userId = getCurrentUserId(req);

      if (userRole !== 'Company') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      // Get company for this user
      const company = await Company.findOne({ where: { userId } });

      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      const notifications = await CompanyNotification.findAll({
        where: { companyId: company.id },
        include: [{
          model: User,
          as: 'clientUser',
          attributes: ['email']
        }],
        order: [['createdAt', 'DESC']],
        limit: 50
      });

      const notificationDtos = notifications.map(notif => ({
        id: notif.id,
        clientEmail: notif.clientUser?.email || 'Unknown',
        documentCount: notif.documentCount,
        sentAt: notif.sentAt,
        isRead: notif.isRead,
        createdAt: notif.createdAt
      }));

      return res.status(200).json(notificationDtos);
    } catch (error) {
      console.error('Get company notifications error:', error);
      return res.status(500).json({ message: `An error occurred: ${error.message}` });
    }
  }

  // Mark notification as read
  async markAsRead(req, res) {
    try {
      const notificationId = parseInt(req.params.id);
      const userId = getCurrentUserId(req);
      const userRole = getCurrentUserRole(req);

      if (userRole !== 'Company') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const company = await Company.findOne({ where: { userId } });
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      const notification = await CompanyNotification.findOne({
        where: { 
          id: notificationId,
          companyId: company.id
        }
      });

      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      notification.isRead = true;
      await notification.save();

      return res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
      console.error('Mark notification as read error:', error);
      return res.status(500).json({ message: `An error occurred: ${error.message}` });
    }
  }

  // Delete notification
  async deleteNotification(req, res) {
    try {
      const notificationId = parseInt(req.params.id);
      const userId = getCurrentUserId(req);
      const userRole = getCurrentUserRole(req);

      if (userRole !== 'Company') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const company = await Company.findOne({ where: { userId } });
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      await CompanyNotification.destroy({
        where: { 
          id: notificationId,
          companyId: company.id
        }
      });

      return res.status(200).json({ message: 'Notification deleted' });
    } catch (error) {
      console.error('Delete company notification error:', error);
      return res.status(500).json({ message: `An error occurred: ${error.message}` });
    }
  }

  // Clear all notifications
  async clearAll(req, res) {
    try {
      const userId = getCurrentUserId(req);
      const userRole = getCurrentUserRole(req);

      if (userRole !== 'Company') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const company = await Company.findOne({ where: { userId } });
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      await CompanyNotification.destroy({
        where: { companyId: company.id }
      });

      return res.status(200).json({ message: 'All notifications cleared' });
    } catch (error) {
      console.error('Clear all company notifications error:', error);
      return res.status(500).json({ message: `An error occurred: ${error.message}` });
    }
  }
}

module.exports = new CompanyNotificationController();

