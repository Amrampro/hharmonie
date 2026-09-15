// api/src/controllers/admin/usersController.js
import { query } from '../../config/database.js';
import bcrypt from 'bcrypt';

export const getAllUsers = async (req, res) => {
  try {
    const { search, limit = 50, offset = 0 } = req.query;

    let sql = 'SELECT id, email, first_name, last_name, phone, is_admin, created_at FROM users WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const users = await query(sql, params);

    const countSql = 'SELECT COUNT(*) as total FROM users';
    const countResult = await query(countSql);

    res.json({
      users,
      total: countResult[0].total
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const users = await query(
      'SELECT id, email, first_name, last_name, phone, is_admin, created_at FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const orderCount = await query(
      'SELECT COUNT(*) as count, SUM(total) as total_spent FROM orders WHERE user_id = ?',
      [id]
    );

    res.json({
      user: users[0],
      stats: orderCount[0]
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, phone, isAdmin } = req.body;

    const updates = [];
    const values = [];

    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (firstName !== undefined) {
      updates.push('first_name = ?');
      values.push(firstName);
    }
    if (lastName !== undefined) {
      updates.push('last_name = ?');
      values.push(lastName);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (isAdmin !== undefined) {
      updates.push('is_admin = ?');
      values.push(isAdmin ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    const users = await query(
      'SELECT id, email, first_name, last_name, phone, is_admin FROM users WHERE id = ?',
      [id]
    );

    res.json({
      message: 'User updated successfully',
      user: users[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await query('DELETE FROM users WHERE id = ?', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
