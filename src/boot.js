require('./lib/process');
require('corifeus-utils');

module.exports = async () => {
    const corifeus = require('./registry');
    require('./lib/settings');
    require('./lib/console');
    const cluster = require('./lib/cluster');
    await cluster();
}

