module.exports = {
    apps : [{
      name   : "engine",
      script : "dist/src/index.js",
      env_production: {
         NODE_ENV: "production"
      },
      env_development: {
         NODE_ENV: "development",
         VERBOSITY: "3" 
      }
    }]
  }