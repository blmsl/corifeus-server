/**
 * PHATOMJS SERVER RENDERING

 https://github.com/blockai/phantom-pool
 requires babel=polyfill for server rendering

 */
const phantom = require('phantom');
const utils = require('corifeus-utils');
const agent = 'corifeus-server-renderer';
const ms = require('ms');
const _ = require('lodash');

const corifeus = require('../../registry');

const service = function(settings) {
    const consolePrefix = service.prefix;
    console.info(`${consolePrefix} started`);

    const redis = corifeus.core.redis;
    const redisPrefix = redis.register.prefix('phantom');

    if (corifeus.core.settings.boot.debug) {
        //shutdownMinutes =10;
    }

    const redisTtlMinutes = settings.redisTtlMinutes * 60;
    // seconds
    if (redisTtlMinutes> 0) {
        console.info(`${consolePrefix} Cache TTL: ${ms(redisTtlMinutes* 1000)}`);
    } else {
        console.info(`${consolePrefix} Cache disabled`);
    }

    const timeoutMs = settings.timeoutSeconds * 1000;
    const minIteration = 8;
    const defaultWait = 444;

    console.info(`${consolePrefix} Max timeout: ${ms(timeoutMs)}`);

    this.boot = () => {
        console.debug(`${consolePrefix} ready`)
    };

    const debugResult = (result) => {
        console.debug(`${consolePrefix} result`, utils.object.reduce(result));
    }


    this.instance = async () => {
        return await phantom.create([
                '--ignore-ssl-errors=yes'
            ], {
                /*
                 logger: {
                 warn: console.log,
                 debug: console.debug,
                 error: console.debug
                 },
                 logLevel: 'info',
                 */
            });
    }

    this.render= async (url) => {

        let instance;
        const start = new Date().getTime();

        let page;
        let resolver;
        let rejecter;
        const promise = new Promise((resolve, reject) => {
            const all = async () => {
                if (page !== undefined) {
                    try {
                        await page.close();
                        if (instance !== undefined) {
                            await instance.exit();
                        }
                        console.debug(`Quit page`)
                    } catch (e ) {
                        console.error(e);
                    }
                }
            }
            resolver = async (result) => {
                await all()
                resolve(result)
            };
            rejecter = async (error) => {
                await all();
                reject(error);
            };
        })

        try {
            const redisKey = `${redisPrefix}${url}`;

            if (redisTtlMinutes > 0) {
                const exits  = await redis.client.exists(redisKey);
                if (exits) {
                    console.debug(`${consolePrefix} found redis cache: ${redisKey}`);
                    const result = JSON.parse(await redis.client.get(redisKey));
                    debugResult(result);
                    resolver(result);
                    return promise;
                }
            }

            instance = await this.instance();

            page = await instance.createPage();
            page.setting('userAgent', agent);
            console.debug(`${consolePrefix} url: ${url}`);

            page.property('viewportSize',  {
                width: 1400,
                height: 900
            });

            page.on("onResourceRequested", function(requestData) {
                console.debug(consolePrefix + ' onResourceRequested: ' +  requestData.url );
            });

            page.property('onLoadFinished', function(status) {
                console.debug(consolePrefix + ' onLoadFinished: ' + status);
                //page.render('snapshot.png');
            });

            page.property('onConsoleMessage', function(msg) {
                console.debug(consolePrefix + ' onConsoleMessage: ' + msg);
            });

            const status = await page.open(url);
            console.debug(`${consolePrefix} status: ${status}`);

            if (status !== 'success') {
                rejecter(new Error(`${consolePrefix}: status: ${status}`));
                return promise;
            }

            let iteration = 0;
            let isComplete = false;
            let isDone = false;
            const check = (wait = defaultWait) => {
                setTimeout(async () => {

                    if (!isComplete) {
                        const readyState = await page.evaluate(function () {
                            return document.readyState;
                        });
                        if ("complete" === readyState) {
                            isComplete = true;
                            await page.injectJs('./node_modules/babel-polyfill/dist/polyfill.min.js');
                            (await page.evaluate(function() {
                                window.corifeusPhantom.wait = false;
                            }))
                        }
                    } else {
                        const phantomBrowserData = (await page.evaluate(function() {
                            return window.corifeusPhantom;
                        }))
                        let counter = 0;
                        let wait = false;
                        if (_.hasIn(phantomBrowserData, 'status.corifeus.core.http.counter')) {
                            counter = phantomBrowserData.status.corifeus.core.http.counter;
                            wait = phantomBrowserData.wait;
                        }
                        console.debug(`${consolePrefix} iteration: ${iteration}, HTTP counter: ${counter}, Wait: ${wait}`);
                        if (counter === 0 && wait === false ) {
                            iteration++
                            if (iteration >= minIteration) {
                                isDone = true;
                                let status = (await page.evaluate(function () {
                                    return window.corifeus.core.http.status;
                                }));
                                if (status == null) {
                                    status = 200
                                }
                                const pageContent = await page.property('content');
                                const time = new Date().getTime() - start;
                                const result = {
                                    content: pageContent,
                                    status: status,
                                    time: time,
                                };
                                debugResult(result)
                                if (redisTtlMinutes> 0) {
                                    redis.client.set(redisKey, JSON.stringify(result), 'ex', redisTtlMinutes);
                                }
                                resolver(result);
                            }
                        } else {
                            iteration = 0;
                        }
                    }
                    if (!isDone) {
                        const time = new Date().getTime() - start;
                        if (time > timeoutMs) {
                            console.debug(`${consolePrefix} timeout: ${time} > ${timeoutMs}`);

                            const pageContent = await page.property('content');
                            const result = {
                                time: time,
                                content: pageContent,
                                status: 500,
                                message: `timeout ${ms(timeoutMs)}`
                            };
                            debugResult(result)
                            resolver(result);
                            return;
                        }
                        check();
                    }
                }, wait);
            }
            check(0);

            return promise;
        } catch(e) {
            if (instance !== undefined) {
                await instance.exit();
            }
            throw e;
        }
    }
}

service.wants = ['redis'];
service.alias = 'phantom';

module.exports = service;