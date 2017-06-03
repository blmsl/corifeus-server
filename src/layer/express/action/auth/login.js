const corifeus = require('../../../../registry');

const utils = require('corifeus-utils');

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
        await corifeus.core.lib.express.auth.login(req, login.username);

        let auto;
        if (login.hasOwnProperty('auto') && login.auto === true) {
            auto = await corifeus.core.lib.express.auth.auto(res, login.username);
        }

        const result = {
            message: 'authorized',
            token: req.corifeus.session.token,
            auto: auto,
        };
        res.ok(result);
    } else {
        const error = new Error('unauthorized')
        error.errors = errors;
        res.status(401).send(error);
    }

}

