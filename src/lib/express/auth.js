const corifeus = require('../../registry');

module.exports.login = async(req, username) => {
    const user = await corifeus.core.auth.login(username);
    if (req.corifeus.session === undefined) {
        req.corifeus.session = await corifeus.core.session.new();
    }
    await req.corifeus.session.assign({
        username: user.username,
        roles: user.roles
    })
}

module.exports.auto = async(res, username, expiry) => {
    if (typeof(expiry) === 'string') {
        expiry = utils.time.span(expiry);
    }
    let autoToken = await corifeus.core.auth.token.auto(username, expiry);
    let auto = autoToken.token;
    res.set(corifeus.core.settings.token.auto.header, auto)
    return auto;
}