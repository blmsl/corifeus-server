const corifeus = require('../../../../registry');

module.exports =  async(req, res) => {
    res.ok({
        settings: corifeus.core.settings,
    });
};