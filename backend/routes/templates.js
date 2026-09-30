const express = require('express');
const mongoose = require('mongoose');
const EmailTemplate = require('../models/EmailTemplate');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const isId = value => mongoose.Types.ObjectId.isValid(value);

const validatePayload = body => {
  const name = String(body.name || '').trim();
  const subject = String(body.subject || '').trim();
  const message = String(body.message || '');
  const html = String(body.html || '');
  if (!name || !message) return { error: 'Template name and message are required' };
  if (name.length > 120 || subject.length > 200 || message.length > 100000 || html.length > 200000) {
    return { error: 'Template content exceeds the allowed size' };
  }
  return { value: { name, subject, message, html } };
};

router.use(requireAuth);

router.get('/', async (req, res) => {
  const templates = await EmailTemplate.find({ user: req.user._id })
    .sort({ updatedAt: -1 }).select('-__v').lean();
  res.json({ success: true, templates });
});

router.post('/', async (req, res) => {
  const parsed = validatePayload(req.body);
  if (parsed.error) return res.status(400).json({ success: false, message: parsed.error });
  try {
    const template = await EmailTemplate.create({ ...parsed.value, user: req.user._id });
    res.status(201).json({ success: true, template });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'A template with that name already exists' });
    throw error;
  }
});

router.patch('/:id', async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid template id' });
  const parsed = validatePayload(req.body);
  if (parsed.error) return res.status(400).json({ success: false, message: parsed.error });
  try {
    const template = await EmailTemplate.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id }, parsed.value,
      { new: true, runValidators: true }
    ).select('-__v');
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, template });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'A template with that name already exists' });
    throw error;
  }
});

router.delete('/:id', async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid template id' });
  const result = await EmailTemplate.deleteOne({ _id: req.params.id, user: req.user._id });
  if (!result.deletedCount) return res.status(404).json({ success: false, message: 'Template not found' });
  res.json({ success: true });
});

module.exports = router;
