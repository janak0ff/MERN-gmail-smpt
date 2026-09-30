module.exports = {
  apps: [
    {
      name: 'quick-mail-backend',
      cwd: './backend',
      script: 'server.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production'
      },
      time: true,
      max_memory_restart: '300M',
      kill_timeout: 5000,
      listen_timeout: 10000,
      exp_backoff_restart_delay: 100
    },
    {
      name: 'quick-mail-worker',
      cwd: './backend',
      script: 'workers/emailWorker.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production'
      },
      time: true,
      max_memory_restart: '300M',
      kill_timeout: 5000,
      exp_backoff_restart_delay: 100
    }
  ]
};
