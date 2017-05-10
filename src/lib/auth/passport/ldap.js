module.exports = async (login, settings) => {
    const ldap = require('ldapjs');
    const _ = require('lodash');

    return new Promise((resolve, reject) => {

        const options = Object.assign({}, settings.ldapjs.options);

        const client = ldap.createClient(options);
        const template = _.template(settings.ldapjs.bind.dn);
        const dn = template(login);

        client.bind(dn, login.password, (err) => {
            if (err) {
                reject(err)
            }
            client.search(dn, {}, function(err, res) {
                res.on('searchEntry', function(entry) {
                    resolve({
                        result: true,
                        object: entry.object
                    });
                });
                res.on('error', function(err) {
                    reject(err)
                });
            });
        });
    })
}