const corifeus = require('../../registry');
const utils = require('corifeus-utils')
const uuid = require('uuid');

module.exports = function (options) {

    const { instance, factory} = options;

    const consolePrefix = `${factory.prefix} [COMMUNICATE] `

    this.subscribe = (options) => {

        const { channels } = options;

        const { resolve, promise, reject} = utils.promise.deferred();

        console.info(`${consolePrefix } Subscribe to: ${channels.join(',')}`)

        const args = channels.slice();
        args.push((err, count) => {
            if (err) {
                return reject(err);
            }
            console.info(`${consolePrefix } Subscribed ${count} channels`)
            resolve(count);
        })

        const subscriber = corifeus.core.redis.new();
        subscriber.subscribe.apply(subscriber, args);

        subscriber.on('message', async (channel, message) => {
            message = JSON.parse(message);
            let executer = corifeus;
            const executerNamespace = message.action.split('.');
            executerNamespace.shift();
            executerNamespace.forEach(namespace => executer = executer[namespace]);
            const response = await executer(message.request)
//            console.debug(`${consolePrefix } Response`, response);

            corifeus.core.redis.client.publish('response', JSON.stringify({
                response: response,
                requestId: message.requestId,
                action: message.action,
            }))
        })
        return promise;
    }

    this.exec = async function(options) {

        let {
            channel,
            action,
            request,
            multi,
            allowTimeout,
            timeout
        } = options;

        timeout = timeout || 20000;

        let multiCount = 0;
        multi = multi || false;

        const { promise, resolve, reject} = utils.promise.deferred();

        const requestId = uuid.v4();

        const subscriber = corifeus.core.redis.new();

        const responseArray = [];

        subscriber.subscribe('response', () => {
            subscriber.on('message', (channel, message ) => {
                message = JSON.parse(message);
                if (message.requestId === requestId) {

                    if (multi === false) {
                        resolve({
                            multi: multi,
                            response: message.response
                        });
                        subscriber.disconnect();
                    } else {
                        multiCount++;
                        responseArray.push(message.response);
                        if (multiCount === multi) {
                            clearTimeout(cancel)

                            resolve({
                                multi: multi,
                                response: responseArray
                            });
                            subscriber.disconnect();
                        }
                    }

                }
            })

            corifeus.core.redis.client.publish(channel, JSON.stringify({
                action: action,
                request: request,
                requestId:  requestId,
            }));
        });

        let cancel;
        if (allowTimeout) {
            cancel = setTimeout(() => {
                resolve({
                    multi: multi,
                    response: responseArray
                });
                subscriber.disconnect();
            }, allowTimeout)
        } else {
            cancel = setTimeout(() => {
                reject(new Error(`timeout ${timeout}`))
                subscriber.disconnect();
            }, timeout)

        }

        return promise;

    }

    return this;
}

