const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const queueName = process.env.EMAIL_QUEUE_NAME || 'email-delivery';
const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true
});

const emailQueue = new Queue(queueName, {
  connection,
  defaultJobOptions: {
    attempts: Number.parseInt(process.env.QUEUE_MAX_ATTEMPTS || '5', 10),
    backoff: {
      type: 'exponential',
      delay: Number.parseInt(process.env.QUEUE_BACKOFF_MS || '5000', 10)
    },
    removeOnComplete: 1000,
    removeOnFail: 5000
  }
});

const closeQueue = async () => {
  await emailQueue.close();
  await connection.quit();
};

module.exports = { emailQueue, queueName, connection, closeQueue };
