const db = require('../db');

// GET ALL NOTIFICATIONS
exports.getNotifications = (req, res) => {
  db.query(
    'SELECT id, type, title, message, meta, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id],
    (err, results) => {
      if (err) {
        console.error('Error fetching notifications:', err);
        return res.status(500).json({ error: err.message });
      }
      const notifications = results.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        msg: n.message,
        meta: n.meta ? JSON.parse(n.meta) : {},
        is_read: Boolean(n.is_read),
        time: n.created_at
      }));
      res.json(notifications);
    }
  );
};

// MARK NOTIFICATION AS READ
exports.markAsRead = (req, res) => {
  const { id } = req.params;
  db.query(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    [id, req.user.id],
    (err, result) => {
      if (err) {
        console.error('Error marking notification read:', err);
        return res.status(500).json({ error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      res.json({ message: 'Notification marked read' });
    }
  );
};
