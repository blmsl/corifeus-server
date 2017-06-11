const corifeus = require('../../registry');

const isLocal = (req) => {
    let isLocal = false;
    const ip = req.ip;

    if (ip === undefined); {
        return false;
    }
    for (let localIp of corifeus.core.settings.boot.core.service.express.local) {
        if (ip.startsWith(localIp)) {
            isLocal = true;
            break;
        }
    }
    return isLocal;
}

module.exports.isLocal = isLocal;
module.exports.route = require('./route');
module.exports.auth = require('./auth');
module.exports.decorator = require('./decorator');
module.exports.middleware = require('./middleware');