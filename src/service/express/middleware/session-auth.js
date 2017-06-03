const uuid = require('uuid');

const corifeus = require('../../../registry');
const utils = require('corifeus-utils');

const tokenSession = () => {

    return async(req, res, next) => {

        try {
            const consolePrefix = `${corifeus.core.express.prefix} MIDDLEWARE [SESSION]`

            let token;
            if (req.headers.hasOwnProperty(corifeus.core.settings.token.header)) {
                token = req.headers[corifeus.core.settings.token.header]
            }

            try {
                if (!utils.string.empty(token)) {
                    req.corifeus.session = await corifeus.core.session.get(token);
                }
            } catch (e) {
                let autoLogin = false;
                try {
                    let auto;
                    if (req.headers.hasOwnProperty(corifeus.core.settings.token.header)) {
                        auto = req.headers[corifeus.core.settings.token.auto.header];
                    }
                    if (!utils.string.empty(auto)) {
                        const autoData = await corifeus.core.auth.token.verify(auto);
                        await corifeus.core.lib.express.auth.login(req, autoData.data.payload.username);
                    }
                    autoLogin = true;
                } catch(eInner) {
                    console.warn(eInner);
                }
                if (!corifeus.core.settings.token.allowedUrl.includes(req.url) && !autoLogin) {
                    throw  e;
                }
            }
            next();
        } catch (e) {
            next(e);
        }

    };

}
module.exports = tokenSession;