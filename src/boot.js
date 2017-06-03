require('./lib/process');
require('corifeus-utils');

module.exports = async () => {
    const corifeus = require('./registry');
    require('./lib/settings');
    require('./lib/console');
    const loader = require('./lib/loader');
    await loader('lib');
    await corifeus.core.lib.cluster();
}

