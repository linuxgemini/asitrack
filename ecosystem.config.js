module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [

    // First application
    {
      name      : 'asitrack',
      script    : 'index.js',
      watch     : false
    }
  ]
};
