const CDP = require('chrome-remote-interface');
const utils = require('corifeus-utils');
const agent = 'corifeus-server-renderer';
const ms = require('ms');
const _ = require('lodash');

const corifeus = require('../../registry');

const findPort = require('find-open-port');

const execFile = require('child_process').execFile;

const service = function (settings) {
    const consolePrefix = service.prefix;
    console.info(`${consolePrefix} started`);

    const redis = corifeus.core.redis;
    const redisPrefix = redis.register.prefix('chrome');

    if (corifeus.core.settings.boot.debug) {
        //shutdownMinutes =10;
    }

    const redisTtlMinutes = settings.redisTtlMinutes * 60;
    // seconds
    if (redisTtlMinutes > 0) {
        console.info(`${consolePrefix} Cache TTL: ${ms(redisTtlMinutes * 1000)}`);
    } else {
        console.info(`${consolePrefix} Cache disabled`);
    }

    const timeoutMs = settings.timeoutSeconds * 1000;

    console.info(`${consolePrefix} Max timeout: ${ms(timeoutMs)}`);

    let killTimeout = settings.killSeconds * 1000;

    console.info(`${consolePrefix} Max kill timeout: ${ms(killTimeout)}`);

    const cacheDir = `${process.cwd()}/${settings.cache}`;

    this.boot = async () => {
        console.debug(`${consolePrefix} ready`)
        await utils.fs.ensureDir(cacheDir);
    };

    const debugResult = (result) => {
        console.debug(`${consolePrefix} result`, utils.object.reduce(result));
    }

    let mainClientPromised;
    let port;
    let run;

    let killTimeoutSetTimout;
    let timeoutResolve;

    let startChromeLoadingDone = false;
    let firstConnect = false;

    const cleanupChrome  = () => {
        startChromeLoadingDone = false;
        firstConnect = false;
        clearTimeout(timeoutResolve);
        clearTimeout(killTimeoutSetTimout);
        mainClientPromised = undefined;
        port = undefined;
        if (run) {
            run.kill();
        }
    }

    const connectChrome = async () => {
        if (startChromeLoadingDone === false && firstConnect !== false) {
            while(!startChromeLoadingDone) {
                await utils.timer.wait(500);
            }
        }
        firstConnect = true;
        console.debug(`${consolePrefix} connectChrome`);

        clearTimeout(killTimeoutSetTimout);

        killTimeoutSetTimout = setTimeout(() => {
            cleanupChrome();
        }, killTimeout)

        if (mainClientPromised !== undefined) {
            return;
        }
        mainClientPromised = utils.promise.deferred();

        console.debug(`${consolePrefix} connectChrome client connecting now`);

        const retry = 250;
        const maxConnectRetry = 5;
        let connectRetryCount = 0;

        const startChrome = async () => {

            let available = false;
            do {
                port = utils.random.integer(30000, 40000);
                available = await findPort.isAvailable(port)
            } while (!available)


            console.debug(`${consolePrefix} Found chrome new debug port: ${port}`);

            const {resolve, reject, promise} = utils.promise.deferred();

            const mainRejecter = (error) => {
                console.log(consolePrefix, 'mainRejecter problem');
                cleanupChrome();
                reject(error);
            }

            run = execFile('/opt/google/chrome/chrome', [`--remote-debugging-port=${port}`, '--headless', '--disable-gpu', '--enable-logging', /** '--v=1', **/ '--log-level=0', `--user-data-dir=${cacheDir}`, `--user-agent="${agent}"`, 'about:blank'], (err, stdout, stderr) => {
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
            run.on('close', function () {
                console.debug(`${consolePrefix} close`, arguments)
            })
            run.on('disconnect', function () {
                console.debug(`${consolePrefix} disconnect`, arguments)
            })
            run.on('error', function () {
                console.error(`${consolePrefix} error`, arguments)
            })
            run.on('message', function () {
                console.debug(`${consolePrefix} message`, arguments)
            })
            run.on('exit', function () {
                console.debug(`${consolePrefix} exit`, arguments)
            })

            await utils.timer.wait(2500);

            timeoutResolve = setTimeout(() => {
                resolve();
            }, retry)

            await promise;
            console.debug(`${consolePrefix} start chrome now running
            `);
            return run;
        }

        let worksChrome = false;
        let maxTry = 10;
        let tries = 0;
        do {
            try {
                console.debug(`${consolePrefix} start chrome now`);
                run = await startChrome();
                worksChrome = true;
            } catch (e) {
                tries++;
                console.warn(`${consolePrefix}`, e);
                if (tries > maxTry) {
                    throw new Error(consolePrefix, 'cannot start Chrome process');
                }
            }
        } while (!worksChrome)

        console.debug(`${consolePrefix} start chrome now running found`);

        const connect = async () => {
            const client = await CDP({
//                port: port,
                target: `ws://localhost:${port}/devtools/browser`
            });
            console.debug(consolePrefix, 'client done');

            mainClientPromised.client = client;
            mainClientPromised.run = run;

            // enable events then start!
            try {
                console.debug(consolePrefix, 'client enabled');
                mainClientPromised.resolve();
            } catch (e) {
                console.debug(consolePrefix, 'client enabled error');

                console.warn(consolePrefix, 'chrome-remote-interface error, try again', port, err);
                if (err.code === 'ECONNREFUSED') {
                    connectRetryCount++;
                    if (connectRetryCount < maxConnectRetry) {
                        setTimeout(() => {
                            connect();
                        }, retry * (connectRetryCount + 1))
                    } else {
                        throw(err);
                    }
                } else {
                    throw(err);
                }
                generatedReject(e);
            } finally {
            }
        }
        await connect();
        startChromeLoadingDone = true;
        return mainClientPromised.promise;
    }

    this.render = async (url) => {
        try {
           const redisKey = `${redisPrefix}${url}`;

            if (redisTtlMinutes > 0) {
                const exits = await redis.client.exists(redisKey);
                if (exits) {
                    console.debug(`${consolePrefix} found redis cache: ${redisKey}`);
                    const result = JSON.parse(await redis.client.get(redisKey));
                    debugResult(result);
                    return result;
                }
            }

            await connectChrome();
            console.debug(`${consolePrefix} render start`);

            if (url.endsWith('/')) {
                url = url.slice(0, -1);
            }
            console.debug(`${consolePrefix} Chrome load`, url);

            console.debug(`${consolePrefix} render tab generating`);

            async function doInNewContext(action) {
                console.debug(consolePrefix, 'doInNewContext')
                // connect to the DevTools special target
                const browser = mainClientPromised.client;
//            await browser.open();
                // create a new context
                const {Target} = browser;
                const {browserContextId} = await Target.createBrowserContext();
                const {targetId} = await Target.createTarget({
                    url: 'about:blank',
                    browserContextId,
                    port: port,
                });
                // connct to the new context
                const client = await CDP({
                    target: targetId,
                    port: port,
                });
                // perform user actions on it
                try {
                    return await action(client);
                } finally {
                    // cleanup
                    await Target.closeTarget({targetId});
                }
            }

            const tab = async () => {

                console.debug(`${consolePrefix} render new tab start`);

                // this basically is the usual example
                async function newTab(client) {
                    // extract domains
                    client.Security.certificateError(({eventId}) => {
                        client.Security.handleCertificateError({
                            eventId,
                            action: 'continue'
                        });
                    });


                    // enable events then start!
                    await Promise.all([
                        client.Network.enable(),
                        client.Page.enable(),
                        client.Security.enable(),
                        client.Security.setOverrideCertificateErrors({override: true}),
                    ]);

                    // setup handlers
                    client.Network.requestWillBeSent((params) => {
                        console.debug(consolePrefix, params.request.url);
                    });

                    console.debug(consolePrefix, 'Page.navigate', url);
                    await client.Page.navigate({
                        url: url,
                    });

                    await client.Page.loadEventFired();

                    const getHtml = async () => {
                        const evaluated = await client.Runtime.evaluate({expression: 'document.documentElement.innerHTML'})
                        //console.log(consolePrefix, 'getHtml', evaluated)
                        return evaluated.result.value;
                    }
                    const state = async () => {
                        const evaluatedCorifeusPreloader = await client.Runtime.evaluate({expression: `(() => { if (typeof window.corifeusPreloader === 'object') { window.corifeusPreloader.wait = false; return false; } else { return false; };})()`})
                        console.log(consolePrefix, 'evaluatedCorifeusPreloader', evaluatedCorifeusPreloader.result.value)


                        const evaluated = await client.Runtime.evaluate({expression: `window.corifeus && window.corifeus.core && window.corifeus.core.http ?  window.corifeus.core.http.counter : undefined`})
                        console.log(consolePrefix, 'state', evaluated)
                        return evaluated.result.value;
                    }

                    const stateUrlList = async () => {
                        const evaluated = await client.Runtime.evaluate({expression: `JSON.stringify(window.corifeus)`})
                        console.log(consolePrefix, 'stateUrlList', evaluated)
                        return evaluated.result.value;
                    }

                    const httpStatus = async () => {
                        const evaluated = await client.Runtime.evaluate({expression: `window.corifeus && window.corifeus.core && window.corifeus.core.http ?  window.corifeus.core.http.status : 500`})
                        console.log(consolePrefix, 'httpStatus', evaluated)
                        return evaluated.result.value;
                    }


                    let wait = 250;
                    let minIteration = 10;
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
                            iteration = 0;
//                            console.debug('rightWaitTotalStatus', rightWaitTotalStatus)
                            let stateUrlListResult;
                            if (rightWaitTotalStatus === 0) {
                                stateUrlListResult = await stateUrlList();

                                if (stateUrlListResult !== undefined) {
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
                        lastModifiedDate: (new Date()).toUTCString(),
                    }
                    if (redisTtlMinutes > 0) {
                        redis.client.set(redisKey, JSON.stringify(result), 'ex', redisTtlMinutes);
                    }
                    return result;
                }
                return await doInNewContext(newTab);
            }
            return await tab();

        } catch (e) {
            console.error(e);
            throw e;
        }
    }
}

service.wants = ['redis'];
service.alias = 'chrome';

module.exports = service;