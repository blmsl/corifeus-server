const corifeus = require('../../../registry');

module.exports = async (app)  => {
    return corifeus.core.lib.express.route.auto(app, `${__dirname}/../action/system`);;
};
