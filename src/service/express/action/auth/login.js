const corifeus = require('../../../../registry');

module.exports =  async (req, res) => {

    const auth = corifeus.core.lib.auth;
    const _ = require('lodash');

    const login = req.body;
    let loginResult = false;
    const errors = {};

    for(let passport of corifeus.core.lib.auth.settings.passports) {
        try {
            loginResult = await auth.passport[passport.type](login, passport)
            if (loginResult.result === true) {
                break;
            }
            loginResult = false;
        } catch (e) {
            errors[passport.type] = e;
        }
    }

    if (loginResult !== false && loginResult.result === true) {
        await corifeus.core.express.lib.auth.login(req, login.username);

        // fixme autologin logic - use in a module
        let auto;
        if (login.hasOwnProperty('auto') && login.auto === true) {
            let autoToken;
            let expiry = null;
            if (login.hasOwnProperty('expiry')) {
                if (typeof(login.expiry) === 'string') {
                    expiry = corifeus.core.util.time.span(login.expiry);
                } else {
                    expiry = login.expiry;
                }
            }
            autoToken = await corifeus.core.auth.token.auto(login.username, expiry);
            auto = autoToken.token;
            let cookieOptions = {};
            if (autoToken.data.expiryMs !== undefined) {
                cookieOptions.expires = new Date(autoToken.data.expiryMs);
                cookieOptions.maxAge = autoToken.data.expiryMs - new Date().getTime();
            }
            res.cookie(corifeus.core.settings.token.auto.cookie, auto, cookieOptions)
            res.set(corifeus.core.settings.token.auto.header, auto)
        } else {
            res.clearCookie(corifeus.core.settings.token.auto.cookie);
        }

        const result = {
            message: 'authorized',
            token: req.corifeus.session.token,
        };
        res.ok(result);
    } else {
        const error = new Error('unauthorized')
        error.errors = errors;
        res.status(401).send(error);
    }

}

