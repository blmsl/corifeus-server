const corifeus = require('../../registry');

module.exports = async (username) => {
    const roles = [];
    if (corifeus.core.auth.settings.admin.includes(username) && !roles.includes('admin')) {
        roles.push('admin');
    }
    const user =  {
        roles: roles,
        username: username
    }
    return user;
}