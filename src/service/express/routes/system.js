const routeAuto = require('../route-auto');

module.exports = async (app)  => {
    return routeAuto(app, `${__dirname}/../action/system`);;
};
