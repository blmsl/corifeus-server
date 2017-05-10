const corifeus = require('../../../registry');

const middleware = (options) => {
    return (req, res, next) => {

        const consolePrefix = corifeus.core.service.express.prefix;

        const rEnd = res.end;

        req.corifeus = {
            start: new Date(),
            session: undefined
        };
        Object.defineProperty(req.corifeus, 'local', {
            get: () => {
                let isLocal = false;
                const ip = req.ip;

                for (let localIp of corifeus.core.express.settings.local) {
                    if (ip.startsWith(localIp)) {
                        isLocal = true;
                        break;
                    }
                }
                return isLocal;
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