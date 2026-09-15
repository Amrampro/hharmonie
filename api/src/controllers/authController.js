// api/src/controllers/authController.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

export const signup = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: "All required fields must be provided" });
    }

    const existingUsers = await query("SELECT id FROM users WHERE email = ?", [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await query(
      "INSERT INTO users (email, password_hash, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?)",
      [email, passwordHash, firstName, lastName, phone || ""]
    );

    // ✅ récupérer l’UUID généré
    const users = await query(
      "SELECT id, email, first_name, last_name, phone, is_admin FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    const user = users[0];
    if (!user?.id) {
      return res.status(500).json({ error: "User creation failed" });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    res.status(201).json({
      message: "User created successfully",
      token,
      user,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const users = await query(
      'SELECT id, email, password_hash, first_name, last_name, phone, is_admin FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    delete user.password_hash;

    res.json({
      message: 'Login successful',
      token,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const users = await query(
      'SELECT id, email, first_name, last_name, phone, is_admin, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const updates = [];
    const values = [];

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

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.user.id);

    await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const users = await query(
      'SELECT id, email, first_name, last_name, phone, is_admin FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({
      message: 'Profile updated successfully',
      user: users[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const userId = req.user?.id; // ✅ UUID string
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "currentPassword and newPassword are required" });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }

    // 1) récupérer le hash actuel
    const rows = await query(
      "SELECT password_hash FROM users WHERE id = ? LIMIT 1",
      [userId]
    );

    const user = rows?.[0];
    if (!user) return res.status(404).json({ error: "User not found" });

    // 2) vérifier l'ancien mot de passe
    const ok = await bcrypt.compare(String(currentPassword), user.password_hash);
    if (!ok) return res.status(401).json({ error: "Current password is incorrect" });

    // 3) enregistrer le nouveau hash
    const newHash = await bcrypt.hash(String(newPassword), 10);

    await query(
      "UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?",
      [newHash, userId]
    );

    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Update password error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};