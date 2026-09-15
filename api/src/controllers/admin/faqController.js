import { query } from '../../config/database.js';

export const getAllFAQs = async (req, res) => {
  try {
    const faqs = await query('SELECT * FROM faqs ORDER BY display_order, created_at');

    res.json({ faqs });
  } catch (error) {
    console.error('Admin get FAQs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createFAQ = async (req, res) => {
  try {
    const { question, answer, category, displayOrder } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }

    const result = await query(
      'INSERT INTO faqs (question, answer, category, display_order) VALUES (?, ?, ?, ?)',
      [question, answer, category || '', displayOrder || 0]
    );

    const faqs = await query('SELECT * FROM faqs WHERE id = ?', [result.insertId]);

    res.status(201).json({
      message: 'FAQ created successfully',
      faq: faqs[0]
    });
  } catch (error) {
    console.error('Create FAQ error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, category, displayOrder } = req.body;

    const updates = [];
    const values = [];

    if (question !== undefined) {
      updates.push('question = ?');
      values.push(question);
    }
    if (answer !== undefined) {
      updates.push('answer = ?');
      values.push(answer);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      values.push(category);
    }
    if (displayOrder !== undefined) {
      updates.push('display_order = ?');
      values.push(displayOrder);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    await query(`UPDATE faqs SET ${updates.join(', ')} WHERE id = ?`, values);

    const faqs = await query('SELECT * FROM faqs WHERE id = ?', [id]);

    res.json({
      message: 'FAQ updated successfully',
      faq: faqs[0]
    });
  } catch (error) {
    console.error('Update FAQ error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteFAQ = async (req, res) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM faqs WHERE id = ?', [id]);

    res.json({ message: 'FAQ deleted successfully' });
  } catch (error) {
    console.error('Delete FAQ error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
