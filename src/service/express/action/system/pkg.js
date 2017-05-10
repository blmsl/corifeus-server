const corifeus = require('../../../../registry');

module.exports = (req, res) => {
    res.ok({
        pkg: corifeus.core.lib.settings.pkg
    });
}