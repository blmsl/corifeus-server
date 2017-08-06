require('./lib/process');
const utils = require('corifeus-utils');

module.exports = async () => {

    if (process.argv[2] === 'delay') {
        await utils.timer.waitFile();
        return;
    }

    const corifeus = require('./registry');
    require('./lib/settings');
    require('./lib/console');
    const cluster = require('./lib/cluster');
    await cluster();


 }

