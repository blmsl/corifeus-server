const main = {
    passport: {
        ldap: require('./passport/ldap')
    },
    alias: 'auth',
    token: require('./token'),
    login: require('./login'),
}
module.exports = main;