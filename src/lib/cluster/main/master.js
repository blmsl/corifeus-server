const cluster = require('cluster');
const os = require('os');
const path = require('path');
const _ = require('lodash');
const corifeus = require('../../../registry');
const crypto = require('mz/crypto');

const prefix = '[CLUSTER] [MASTER]'

module.exports = async () => {

    const loader = require('../../loader');
    await loader({
        type: 'lib',
        blacklist: [
            'core.lib.auth'
        ]
    });

    const settings = corifeus.core.lib.settings;

    let cores = settings.boot.core.lib.cluster.core;
    if (cores === 0 || cores === 'auto' || !Number.isInteger(cores)) {
        cores = os.cpus().length;
    }

    const coreSettings = corifeus.core.settings.boot.core;
    await corifeus.core.lib.loader.loader({
        rootPath: path.normalize(`${process.cwd()}/${coreSettings.root}`),
        namespace: 'core',
        type: 'service',
        whitelist: [
            'redis',
            'email',
            'control',
        ]
    });

    console.info('')

    console.log(`${prefix} ${settings.pkg.description} v${settings.pkg.version} on port ${settings.boot.core.service.express.port} started, ${cores} core${cores > 1 ? 's + 1 master' : ''}`);

    //todo create generate secret in its own lib - cluster lib!!!
    // generate secret

    const isDebug = corifeus.core.settings.debug;

    const workerExecArgv=[];
    if (isDebug) {
        workerExecArgv.push('--inspect=5859');
    }
    cluster.setupMaster({
        execArgv: workerExecArgv
    });

    //fixme use cluster prefix for sure, add in a cluster redis lib
    corifeus.core.redis.register.prefix('cluster');

    const secretExists = await corifeus.core.redis.client.exists(settings.redis.prefix.cluster.auth.secret);

    if (!isDebug || !secretExists) {

        // flush on new restart
        console.info(`${prefix} init flushall`)
        await corifeus.core.redis.client.flushall();
        const authSecret = await crypto.randomBytes(128)
        console.debug(`${prefix} new secret`);

        await corifeus.core.redis.client.set(settings.redis.prefix.cluster.auth.secret, authSecret);

    } else {
        console.debug(`${prefix} kept all keys`);
    }

    console.info(`${prefix} MASTER PID:${process.pid}
`);

    cluster.on('exit', (worker, code, signal) => {
        console.error(`${prefix} DIED WORKER PID:${worker.process.pid} CODE: ${code}, SIGNAL: ${signal}`, code, signal);
    });

    await corifeus.core.redis.communicate.subscribe({
        channels: [
            'master'
        ]
    })

    while(Object.keys(cluster.workers).length < cores) {
        corifeus.core.cluster.fork('worker');
    }

}
