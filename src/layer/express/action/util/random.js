const utils = require('corifeus-utils');

module.exports = async (req, res) => {

    let length = Math.round(req.params.length || 64);
    length = Math.max(length, 1);
    length = Math.min(length, 1024);

    const random = await utils.random(length);
    res.ok({
        length: length,
        random: random
    })
}