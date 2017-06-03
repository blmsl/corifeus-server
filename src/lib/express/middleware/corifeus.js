const corifeus = require('../../../registry');

const middleware = (options) => {
    return (req, res, next) => {

        const rEnd = res.end;

        req.corifeus = {
            start: new Date(),
            session: undefined
        };
        Object.defineProperty(req.corifeus, 'local', {
            get: () => {
                return corifeus.core.lib.express.isLocal(req);
            }
        })

        // Setup the key-value object of data to log and include some basic info

        // Proxy the real end function
        res.end = function(chunk, encoding) {

            res.end = rEnd;
            res.end(chunk, encoding);

            req.corifeus.time = (new Date() - req.corifeus.start);
            options.connectors.forEach((connector) => connector(req, res))

        };

        next();
    };

}
module.exports = middleware;

middleware.connector = {
    logger: require('./connector/logger')
}