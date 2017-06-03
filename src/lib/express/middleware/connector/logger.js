const corifeus = require('../../../../registry');

const logger = (consolePrefix) => {
   return (req, res) => {

        console.log(`${consolePrefix} ${res.statusCode} ${req.method} ${req.originalUrl} ${req.corifeus.time}ms ${req.headers['user-agent']}`);

//       console.debug(req.headers)


   }
} ;

module.exports = logger;