const utils = require('corifeus-utils');
const cluster = require('cluster');

module.exports = async () => {
    const corifeus = require('./registry');

    require('./lib/process');
    require('./lib/console');
    require('./lib/settings');
    const loader = require('./lib/loader');
    await loader('lib');
    await corifeus.core.lib.cluster();
}

