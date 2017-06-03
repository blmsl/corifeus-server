const auth = require('../../../../lib/auth/index');
const corifeus = require('../../../../registry');
const _ = require('lodash');

module.exports =  async (req, res) => {

    if (_.hasIn(req, 'corifeus.session.token')) {
        req.corifeus.session = await req.corifeus.session.prolongate();
        const auto = await corifeus.core.lib.express.auth.auto(res, req.corifeus.session.username);
        res.ok({
            message: 'prolongated',
            token: req.corifeus.session.token,
            auto: auto,
        })
    } else {
        res.error({
            message: 'invalid'
        })
    }
}

