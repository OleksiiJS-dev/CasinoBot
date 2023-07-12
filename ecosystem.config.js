module.exports = {
    apps: [
      {
        name: 'casino-bot',
        script: 'index.js',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        log_date_format: 'YYYY-MM-DD HH:mm:ss',
        env: {
          NODE_ENV: 'production',
        },
      },
    ],
  };