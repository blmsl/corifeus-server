const cluster = require('cluster');
const corifeus = require('../../../registry');
const prefix = '[CLUSTER] [SINGLETON]'

module.exports = async() => {
    console.info(`${prefix} started ID ${cluster.worker.id}`);

    const loader = require('../../loader');
    await loader({
        type: 'lib',
        blacklist: [
            'core.lib.auth',
            'core.lib.express',
        ]
    });

    await corifeus.core.lib.loader({
        type: 'service',
        whitelist: [
            'email',
            'redis',
            'chrome',
        ]
    });

    await corifeus.core.redis.communicate.subscribe({
        channels: [
            'master',
            'singleton',
        ]
    })
}
