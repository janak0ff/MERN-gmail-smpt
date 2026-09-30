const express = require('express');
const mongoose = require('mongoose');
const Draft = require('../models/Draft');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const isId = value => mongoose.Types.ObjectId.isValid(value);

const parsePayload = body => {
  const value = {
    to: String(body.to || '').trim(),
    subject: String(body.subject || '').trim(),
    message: String(body.message || ''),
    html: String(body.html || ''),
    lastSavedAt: new Date()
  };
  if (value.to.length > 4000 || value.subject.length > 200 || value.message.length > 100000 || value.html.length > 200000) {
    return { error: 'Draft content exceeds the allowed size' };
  }
  return { value };
};

router.use(requireAuth);

router.get('/', async (req, res) => {
  const drafts = await Draft.find({ user: req.user._id })
    .sort({ updatedAt: -1 }).limit(50).select('-__v').lean();
  res.json({ success: true, drafts });
});

router.post('/', async (req, res) => {
  const parsed = parsePayload(req.body);
  if (parsed.error) return res.status(400).json({ success: false, message: parsed.error });
  const draft = await Draft.create({ ...parsed.value, user: req.user._id });
  res.status(201).json({ success: true, draft });
});

router.post('/autosave', async (req, res) => {
  const parsed = parsePayload(req.body);
  if (parsed.error) return res.status(400).json({ success: false, message: parsed.error });
  if (req.body.draftId && !isId(req.body.draftId)) {
    return res.status(400).json({ success: false, message: 'Invalid draft id' });
  }
  const filter = req.body.draftId
    ? { _id: req.body.draftId, user: req.user._id }
    : { user: req.user._id, _id: new mongoose.Types.ObjectId() };
  const draft = await Draft.findOneAndUpdate(
    filter, { ...parsed.value, user: req.user._id },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  ).select('-__v');
  res.json({ success: true, draft });
});

router.get('/:id', async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid draft id' });
  const draft = await Draft.findOne({ _id: req.params.id, user: req.user._id }).select('-__v');
  if (!draft) return res.status(404).json({ success: false, message: 'Draft not found' });
  res.json({ success: true, draft });
});

router.patch('/:id', async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid draft id' });
  const parsed = parsePayload(req.body);
  if (parsed.error) return res.status(400).json({ success: false, message: parsed.error });
  const draft = await Draft.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id }, parsed.value,
    { new: true, runValidators: true }
  ).select('-__v');
  if (!draft) return res.status(404).json({ success: false, message: 'Draft not found' });
  res.json({ success: true, draft });
});

router.delete('/:id', async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid draft id' });
  const result = await Draft.deleteOne({ _id: req.params.id, user: req.user._id });
  if (!result.deletedCount) return res.status(404).json({ success: false, message: 'Draft not found' });
  res.json({ success: true });
});

module.exports = router;
