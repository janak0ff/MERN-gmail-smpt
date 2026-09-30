const path = require('path');
const fs = require('fs/promises');
const mongoose = require('mongoose');
const { Worker } = require('bullmq');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const emailService = require('../services/emailService');
const { queueName, connection } = require('../queue/emailQueue');

const connectDatabase = async () => {
  const source = process.env.DB_SOURCE || 'local';
  const uri = source === 'cloud'
    ? process.env.MONGODB_URI_CLOUD
    : (process.env.MONGODB_URI_LOCAL || 'mongodb://localhost:27017/mern_smtp');
  if (!uri) throw new Error(`MongoDB URI not found for source: ${source}`);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`Email worker connected to MongoDB (${source})`);
};

const removeAttachments = async (attachments = []) => {
  await Promise.all(attachments.map(async attachment => {
    if (!attachment?.path) return;
    try {
      await fs.unlink(attachment.path);
    } catch (error) {
      if (error.code !== 'ENOENT') console.error('Attachment cleanup failed:', error.message);
    }
  }));
};

const worker = new Worker(queueName, async job => {
  const { attachments = [], ...emailData } = job.data;
  try {
    const result = await emailService.sendEmail({ ...emailData, attachments });
    if (!result.success) throw new Error(result.technicalError || result.error || 'Email delivery failed');
    await removeAttachments(attachments);
    return result;
  } catch (error) {
    const maxAttempts = Number(job.opts.attempts || 1);
    if (job.attemptsMade + 1 >= maxAttempts) await removeAttachments(attachments);
    throw error;
  }
}, {
  connection,
  concurrency: Number.parseInt(process.env.QUEUE_CONCURRENCY || '2', 10)
});

worker.on('completed', job => console.log(`Email job ${job.id} completed`));
worker.on('failed', (job, error) => console.error(`Email job ${job?.id} failed:`, error.message));
worker.on('error', error => console.error('Email worker error:', error.message));

const shutdown = async signal => {
  console.log(`${signal} received, stopping email worker`);
  await worker.close();
  await mongoose.connection.close(false);
  await connection.quit();
  process.exit(0);
};

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));

connectDatabase().catch(error => {
  console.error('Email worker startup failed:', error);
  process.exit(1);
});
