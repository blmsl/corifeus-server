const auth = require('../../../../lib/auth/index');
const corifeus = require('../../../../registry');
const _ = require('lodash');

module.exports =  async (req, res) => {

    if (_.hasIn(req, 'corifeus.session.token')) {
        req.corifeus.session = await req.corifeus.session.prolongate();
        res.ok({
            message: 'prolongated',
            token: req.corifeus.session.token,
        })
    } else {
        res.error({
            message: 'invalid'
        })
    }
}

