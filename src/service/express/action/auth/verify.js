const auth = require('../../../../lib/auth/index');
const _ = require('lodash');

module.exports =  async (req, res) => {

    const corifeus = require('../../../../registry');

    if (req.corifeus.session !== undefined) {
        const data = await req.corifeus.session.verify()

        let auto = undefined;
        try {
            auto = await corifeus.core.auth.token.verify(req.cookies[corifeus.core.settings.token.auto.cookie]);
            auto = auto.verbose
        } catch (e) {
            console.warn(e);
        }
        const result = {
            message: 'verified',
            verbose: data.verbose,
            auto: auto
        };
        res.ok(result)
    } else {
        res.error({
            message: 'invalid'
        })
    }

}

