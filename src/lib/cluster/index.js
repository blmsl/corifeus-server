const cluster = require('cluster');
const os = require('os');

const path = require('path');

const _ = require('lodash');

const corifeus = require('../../registry');

const crypto = require('mz/crypto');

const clusterLoader =  async () => {

    const settings = corifeus.core.lib.settings;

    let cores = settings.boot.core.lib.cluster.core;
    if (cores < 1) {
        cores = os.cpus().length;
    } if (cores < 0) {
        cores = 1;
    }

    const coreSettings = corifeus.core.settings.boot.core;
    await corifeus.core.lib.loader.loader(path.normalize(`${process.cwd()}/${coreSettings.root}`), 'core', 'service', [
        'redis',
        'email',
    ]);
    /**
     * MASTER FUNCTIONS OR 1 CORE
     */
    if (cluster.isMaster || cores === 1) {
        console.info('')
        console.log(`${module.exports.prefix} ${settings.pkg.description} v${settings.pkg.version} on port ${settings.boot.core.service.express.port} started, ${cores} core${cores > 1 ? 's + 1 master' : ''}`);

        //todo create generate secret in its own lib - cluster lib!!!
        // generate secret
        const isDebug = corifeus.core.settings.debug;
        //fixme use cluster prefix for sure, add in a cluster redis lib
        corifeus.core.redis.register.prefix('cluster');
        const secretExists = await corifeus.core.redis.client.exists(settings.redis.prefix.cluster.auth.secret);
        if (!isDebug || !secretExists) {
            // flush on new restart
            console.info(`${module.exports.prefix} init flushall`)
            await corifeus.core.redis.client.flushall();
            const authSecret = await crypto.randomBytes(128)
            console.debug(`${module.exports.prefix} new secret`);
            await corifeus.core.redis.client.set(settings.redis.prefix.cluster.auth.secret, authSecret);
        } else {
            console.debug(`${module.exports.prefix} kept all keys`);
        }
    }


    /**
     * PURE MASTER
     */
    if (cluster.isMaster && cores !== 1) {
        console.info(`${module.exports.prefix} MASTER PID:${process.pid}
`);

        cluster.on('exit', (worker, code, signal) => {
            console.error(`${module.exports.prefix} DIED WORKER PID:${worker.process.pid}`);
        });
        cluster.fork()

        cluster.on('message', (worker, message, handle) => {
            console.info(`${module.exports.prefix} worker: ${worker.id} action: ${message.action}`);
            switch(message.action) {
                case 'forked':
                    worker.send({
                        action: 'init',
                    })
                    break;

                case 'boot':
                    if (Object.keys(cluster.workers).length < cores) {
                        cluster.fork();
                    }
                    break;
            }
        });

        /**
         * WORKER
         */
    } else {
        const boot = async () => {
            console.info(`${module.exports.prefix} Worker started`);
            await corifeus.core.lib.loader('service');
            if (cluster.isWorker) {
                process.send({
                    action: 'boot',
                    workerId: cluster.worker.id
                })
            }
        }
        if (cores === 1) {
            await boot();
        } else {

            process.send({
                action: 'forked',
                workerId: cluster.worker.id
            })

            process.on('message', async (message) => {
                console.info(`${module.exports.prefix} MESSAGE: ${message.action}`)
                switch(message.action) {
                    case 'init':
                        await boot();
                        break;
                }
            });

        }
    }
};

module.exports = clusterLoader;

clusterLoader.stats = require('./stats');

clusterLoader.alias = 'cluster'