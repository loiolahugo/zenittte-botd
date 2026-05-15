module.exports = {
  apps: [{
    name: 'prediction-bot',
    script: 'src/index.js',
    interpreter: 'node',
    watch: false,
    restart_delay: 5000,
    env: { NODE_ENV: 'production' }
  }]
};
