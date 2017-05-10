const corifeus = require('../../../../registry');

const logger = (req, res) => {

    const consolePrefix = corifeus.core.service.express.prefix;

    console.log(`${consolePrefix} ${res.statusCode} ${req.method} ${req.originalUrl} ${req.corifeus.time}ms ${req.headers['user-agent']}`);


};

module.exports = logger;