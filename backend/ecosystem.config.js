module.exports = {
  apps: [
    {
      name: 'kupipodariday-backend',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
