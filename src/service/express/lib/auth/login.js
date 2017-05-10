const corifeus = require('../../../../registry');

module.exports = async(req, username) => {
    const user = await corifeus.core.auth.login(username);
    if (req.corifeus.session === undefined) {
        req.corifeus.session = await corifeus.core.session.new();
    }
    await req.corifeus.session.assign({
        username: user.username,
        roles: user.roles
    })
}