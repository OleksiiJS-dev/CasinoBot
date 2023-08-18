module.exports = {
  apps : [{
    name: "app",
    script: "./index.js",
    kill_timeout : 3000,
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    }
  }]
}