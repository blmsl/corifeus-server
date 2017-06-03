const auth = require('../../../../lib/auth/index');
const _ = require('lodash');

module.exports =  async (req, res) => {

    const corifeus = require('../../../../registry');

    if (req.corifeus.session !== undefined) {
        const data = await req.corifeus.session.verify()

        let auto = undefined;
        if (req.headers[corifeus.core.settings.token.auto.header] !== undefined) {
            try {
                auto = await corifeus.core.auth.token.verify(req.headers[corifeus.core.settings.token.auto.header]);
                auto = auto.verbose
            } catch (e) {
                console.warn(e);
            }

        }
        const result = {
            message: 'verified',
            auto: auto
        };
        res.ok(result)
    } else {
        res.error({
            message: 'unauthorized'
        })
    }

}

