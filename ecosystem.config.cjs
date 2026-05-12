module.exports = {
  apps: [
    {
      name: "finsync-api",
      cwd: "./backend",
      script: "src/server.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
      env_production: {
        NODE_ENV: "production",
        PORT: 3104
      }
    }
  ]
};
