const corifeus = require('../../../../registry');

module.exports = async (req, res) => {

    const util = corifeus.core.util;

    let length = Math.round(req.params.length || 64);
    length = Math.max(length, 1);
    length = Math.min(length, 1024);

    const random = await util.random(length);
    res.ok({
        length: length,
        random: random
    })
}