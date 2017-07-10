const CDP = require('chrome-remote-interface');
const utils = require('corifeus-utils');
const agent = 'corifeus-server-renderer';
const ms = require('ms');
const _ = require('lodash');

const corifeus = require('../../registry');

const findPort = require('find-open-port');

const execFile = require('child_process').execFile;

const service = function(settings) {
    const consolePrefix = service.prefix;
    console.info(`${consolePrefix} started`);

    const redis = corifeus.core.redis;
    const redisPrefix = redis.register.prefix('chrome');

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

    console.info(`${consolePrefix} Max timeout: ${ms(timeoutMs)}`);

    const cacheDir = `${process.cwd()}/${settings.cache}`;

    this.boot = async () => {
        console.debug(`${consolePrefix} ready`)

        await utils.fs.ensureDir(cacheDir);
    };

    const debugResult = (result) => {
        console.debug(`${consolePrefix} result`, utils.object.reduce(result));
    }



    this.render= async (url) => {

        console.debug(`${consolePrefix} Chrome load`, url);

        const redisKey = `${redisPrefix}${url}`;

        if (redisTtlMinutes > 0) {
            const exits  = await redis.client.exists(redisKey);
            if (exits) {
                console.debug(`${consolePrefix} found redis cache: ${redisKey}`);
                const result = JSON.parse(await redis.client.get(redisKey));
                debugResult(result);
                return result;
            }
        }

        const retry = 250;
        const maxConnectRetry = 5;
        let connectRetryCount = 0;
        const startChrome = async () => {
            let port;
            let available = false;
            do {
                port = utils.random.integer(30000, 40000);
                available = await findPort.isAvailable(port)
            } while(!available)

            let timeoutResolve;

            console.debug(`${consolePrefix} Found chrome new debug port: ${port}`);

            const { resolve, reject, promise} = utils.promise.deferred();

            const mainRejecter = (error) => {
                run.kill();
                clearTimeout(timeoutResolve)
                reject(error);
            }


            const run = execFile('/opt/google/chrome/chrome', ['--headless', '--disable-gpu', `--remote-debugging-port=${port}`, url, '--enable-logging', /** '--v=1', **/ '--log-level=0', `--user-data-dir=${cacheDir}`], (err, stdout, stderr) => {
                    if (err) {
                        mainRejecter(err)
                    }
            });

            run.stdout.on('data', (data) => {
                console.debug(consolePrefix, 'stdout', data);
            });
            run.stderr.on('data', (data) => {
                console.warn(consolePrefix, 'stdeerr', data);
                if (data.includes('Address already in use')) {
                    mainRejecter(new Error(data));
                }
            });
            run.on('close', function() {
                console.debug(`${consolePrefix} close`, arguments)
            })
            run.on('disconnect', function() {
                console.debug(`${consolePrefix} disconnect`, arguments)
            })
            run.on('error', function() {
                console.error(`${consolePrefix} error`, arguments)
            })
            run.on('message', function() {
                console.debug(`${consolePrefix} message`, arguments)
            })
            run.on('exit', function() {
                console.debug(`${consolePrefix} exit`, arguments)
            })

            timeoutResolve = setTimeout(() => {
                resolve();
            }, retry)

            await promise;

            return {
                port: port,
                run: run,
            };
        }

        let port;
        let worksChrome = false;
        let chromeInfo;
        let maxTry = 10;
        let tries = 0;
        do{
            try {
                chromeInfo = await startChrome();
                worksChrome = true;
            } catch (e) {
                tries++;
                console.warn(`${consolePrefix}`, e);
                if (tries > maxTry) {
                    throw new Error(consolePrefix, 'cannot start Chrome process');
                }
            }
        } while(!worksChrome)

        const {resolve, reject, promise } = utils.promise.deferred();

        const generatedResolve = (data) => {
            chromeInfo.run.kill();
            resolve(data);
        }

        const generatedReject = function() {
            console.error(arguments);
            chromeInfo.run.kill();
            reject(arguments);
        }


        const connect = () => {
            CDP({
                port: chromeInfo.port
            }, async(client) => {
                const {Network, Page, Runtime} = client;


                // setup handlers
                Network.requestWillBeSent((params) => {
                    console.debug(consolePrefix, params.request.url);
                });

                Page.loadEventFired(() => {
                    console.debug(consolePrefix, 'loadEventFired');
                });
                // enable events then start!
                try {
                    await Promise.all([
                        Network.enable(),
                        Page.enable()
                    ]);
                    const getHtml = async () => {
                        const evaluated = await Runtime.evaluate({expression: 'document.documentElement.innerHTML'})
                        return evaluated.result.value;
                    }
                    const state = async() => {
                        const evaluated = await Runtime.evaluate({expression: `window.corifeus && window.corifeus.core && window.corifeus.core.http ?  window.corifeus.core.http.counter : undefined`})
                        return evaluated.result.value;
                    }

                    const stateUrlList = async() => {
                        const evaluated = await Runtime.evaluate({expression: `JSON.stringify(window.corifeus)`})
                        return evaluated.result.value;
                    }

                    const httpStatus = async() => {
                        const evaluated = await Runtime.evaluate({expression: `window.corifeus && window.corifeus.core && window.corifeus.core.http ?  window.corifeus.core.http.status : 500`})
                        return evaluated.result.value;
                    }


                    let wait = 250;
                    let minIteration = 5;
                    let iteration = 0;
                    let done = false;
                    const totalStatus = Math.round(timeoutMs / 5);
                    let rightWaitTotalStatus = 0;

                    const timeout = setTimeout(() => {
                        console.warn(consolePrefix, `Max timeout ${settings.timeoutSeconds} seconds!`)
                        done = true;
                    }, timeoutMs)

                    do {
                        const status = await state();
//                        console.debug(consolePrefix, 'window.corifeus.core.http.counter', status);
                        if (status === 0) {
                            iteration++;
                            if (iteration >= minIteration) {
                                done = true;
                                clearTimeout(timeout);
                            }
                        } else {
//                            console.debug('rightWaitTotalStatus', rightWaitTotalStatus)
                            let stateUrlListResult;
                            if (rightWaitTotalStatus === 0) {
                                stateUrlListResult = await stateUrlList();

                                if (stateUrlListResult  !== undefined) {
                                    console.debug(consolePrefix, 'stateUrlList ', stateUrlListResult);
                                }
                            }
                            rightWaitTotalStatus += wait;
                            if (rightWaitTotalStatus >= totalStatus) {
                                rightWaitTotalStatus = 0;
                            }
                        }
//                        console.debug(consolePrefix, `wait until corifeus is loaded, ${wait}ms`)
                        await utils.timer.wait(wait);
                    } while (!done)

                    const html = (await getHtml());

                    const result = {
                        status: await httpStatus(),
                        content: html,
                    }
                    if (redisTtlMinutes > 0) {
                        redis.client.set(redisKey, JSON.stringify(result), 'ex', redisTtlMinutes);
                    }
                    generatedResolve(result);
                } catch (e) {
                    generatedReject(e);
                } finally {
                    client.close();
                }

            }).on('error', (err) => {
                console.warn(consolePrefix, 'chrome-remote-interface error, try again', chromeInfo.port, err);
                if (err.code === 'ECONNREFUSED') {
                    connectRetryCount++;
                    if (connectRetryCount < maxConnectRetry) {
                        setTimeout(() => {
                            connect();
                        }, retry * (connectRetryCount + 1))
                    } else {
                        generatedReject(err);
                    }
                } else {
                    generatedReject(err);
                }
            });
        }
        connect();

        return promise;
    }
}

service.wants = ['redis'];
service.alias = 'chrome';

module.exports = service;