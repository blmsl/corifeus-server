const express = require('express');
const corifeus = require('../../registry');
const _ = require('lodash');
const utils = require('corifeus-utils');
const bodyParser = require('body-parser');

const cluster = require('cluster');
const os = require('os');

const service = function() {

    let prefix = service.prefix;

    const settings = corifeus.core.settings.boot.core.service.control;

    const app = express();

    let port = 23502;
    if (_.hasIn(settings, 'control.port')) {
        port = settings.control.port;
    }

    let password;
    if (_.hasIn(settings, 'control.password')) {
        password = settings.control.password;
    }

    const workers = () => {
        return Object.keys(cluster.workers).length;
    }

    const status = async () => {
        let result;
        try {
            result = await corifeus.core.redis.communicate.exec({
                action: 'corifeus.core.cluster.gatherStats',
                channel: 'worker',
                multi: workers(),
            });
            result = result.response.map((response) => {
                return response.usage
            });
        } catch(e) {
            result = e;
        }

        return {
            result: result,
            worker: workers(),
            id: Object.keys(cluster.workers),
        };
    }

    this.boot = async function() {
        const { resolve, reject, promise} = utils.promise.deferred();

        app.use(corifeus.core.lib.express.middleware.corifeus({
            connectors: [
                corifeus.core.lib.express.middleware.corifeus.connector.logger(prefix)
            ]
        }));

        app.use((req, res, next) => {

            if (password === undefined) {
                return next();
            }
            let authorization = req.headers['authorization']
            if (req.query.password !== undefined) {
                authorization = req.query.password;
            }
            if (authorization === password) {
                next();
            } else {
                next(new Error('invalid password'))
            }
        });

        app.use((err, req, res, next) => {
            if (!corifeus.core.lib.express.isLocal(req)) {
                delete err.stack;
            }
            res.status(500).send(err);
        });

        app.use(bodyParser.json());

        app.use(`/worker/:worker`, async (req, res) => {
            let wait = false;

            if (req.params.worker === 'auto') {
                req.params.worker = os.cpus().length;
            }
            const worker = parseInt(req.params.worker);
            if (!Number.isInteger(worker)) {
                return res.status(200).send({
                    error: `invalid worker scale ${req.params.worker}`
                });
            }
            while(worker !== workers()) {
                if (worker > workers()) {
                    wait = true;
                    corifeus.core.cluster.fork('worker');
                } else if (worker < workers()) {
                    const keys = Object.keys(cluster.workers);
                    cluster.workers[keys[keys.length - 1]].disconnect();
                }
            }
            if (wait) {
                await utils.timer.wait(wait ? 5000 : 1000);
            }
            res.send(await status())
        });

        app.use(`/**`, async(req, res) => {
            res.send(await status())
        });

        app.listen(port, () => {
            console.info(`${prefix} ready on ${port}`);
            resolve()
        })


        return promise;
    }
}

service.wants = ['redis'];
service.alias = 'control';

module.exports = service