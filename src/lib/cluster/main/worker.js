const cluster = require('cluster');
const corifeus = require('../../../registry');
const prefix = '[CLUSTER] [WORKER]'

module.exports = async() => {
    console.info(`${prefix} started ID ${cluster.worker.id}`);

    const loader = require('../../loader');
    await loader({
        type: 'lib',

    });

    await corifeus.core.lib.loader({
        type: 'service',
        blacklist: ['core.service.control']
    });

    await corifeus.core.redis.communicate.subscribe({
        channels: [
            'worker',
            `worker-${corifeus.core.settings.instance}-${cluster.worker.id}`
        ]
    })
}
