const uuid = require('uuid');

const corifeus = require('../../../registry');

const tokenSession = () => {

    return async(req, res, next) => {

        try {
            const consolePrefix = `${corifeus.core.express.prefix} MIDDLEWARE [SESSION]`

            let token;
            if (req.headers.hasOwnProperty(corifeus.core.settings.token.header)) {
                token = req.headers[corifeus.core.settings.token.header]
            } else {
                token = req.cookies[corifeus.core.settings.token.cookie];
            }

            try {
                if (!corifeus.core.util.string.empty(token)) {
                    req.corifeus.session = await corifeus.core.session.get(token);
                }
            } catch (e) {
                // fixme add auto cookie into it own module
                let autoLogin = false;
                try {
                    let auto;
                    if (req.headers.hasOwnProperty(corifeus.core.settings.token.header)) {
                        auto = req.headers[corifeus.core.settings.token.auto.header];
                    } else {
                        auto = req.cookies[corifeus.core.settings.token.auto.cookie];
                    }
                    if (!corifeus.core.util.string.empty(auto)) {
                        const autoData = await corifeus.core.auth.token.verify(auto);
                        await corifeus.core.express.lib.auth.login(req, autoData.data.payload.username);
                    }
                    autoLogin = true;
                } catch(eInner) {
                    console.warn(eInner);
                    if (!corifeus.core.settings.token.allowedUrl.includes(req.url)) {
                        res.clearCookie(corifeus.core.settings.token.auto.cookie);
                    }
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