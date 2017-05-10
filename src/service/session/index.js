const uuid = require('uuid');

const corifeus = require('../../registry');
const _ = require('lodash');

const service = function(settings) {

    const redis = corifeus.core.redis;
    const redisPrefix = redis.register.prefix.reuse('session');

    const tokenLib = corifeus.core.lib.auth.token;

    // todo refactor to the lib auth token function
    const createNewSessionToken = async() => {
        const id = uuid.v4();
        const tokenData = await tokenLib.sign({
            id: id
        })
        return tokenData;
    }

    this.new = async() => {
        const tokenData = await createNewSessionToken();
        return await this.get(tokenData);
    };


    /**
     * If id is not undefined, it should be verified already
     * @param token
     * @param id Please make sure should be already verified!
     * @returns {Promise.<{prolongate: (function(*=)), set: (function(*)), assign: (function(*=))}>}
     */
    this.get = async(token) => {

        let data;

        if (_.isObject(token)) {
            data = token.data;
            token = token.token
        } else {
            const tokenVerifyResult = await tokenLib.verify(token);
            data = tokenVerifyResult.data;
        }

        const redisPrefixSessionKey = () => `${redisPrefix}${data.payload.id}`;
        const redisSessionExists = async() => await redis.client.exists(redisPrefixSessionKey())
        const redisSessionExpiry = () => data.expiry - new Date().getTime();
        const redisSessionCreate = async() => {
            await redis.client.set(redisPrefixSessionKey(), "{}", 'NX', 'PX', redisSessionExpiry());
        };
        const redisSessionSet  = async(object) => {
            await redis.client.set(redisPrefixSessionKey(), JSON.stringify(object), 'PX', redisSessionExpiry());
        };
        const redisSessionProlongate  = async() => {
                await redis.client.pexpire(redisPrefixSessionKey(), redisSessionExpiry());
        };

        let sessionData = undefined;
        const sessionGet = async() => {
            if (sessionData !== undefined) {
                return sessionData;
            }
            const exists = await redisSessionExists();
            if (exists) {
                sessionData = JSON.parse(await redis.client.get(redisPrefixSessionKey()));
                return sessionData;
            }
            const result = await createNewSessionToken();
            token = result.token;
            data = result.data
            await redisSessionCreate();
            sessionData = {}
            return sessionData;
        }

        /**
         * req.corifeus.session
         * @type {{set: ((p1:*)), assign: ((p1?:*))}}
         */
        const session = {
            verify: async() => {
                const data = await tokenLib.verify(token);
                return data;
            },
            prolongate: async() => {
                const result = await tokenLib.prolongate(token);
                const session = this.get(result)
                if (await redisSessionExists()) {
                    await redisSessionProlongate();
                }
                return session;
            },
            set: async(obj) => {
                await sessionGet();
                sessionData = obj;
                await redisSessionSet(sessionData);
                return sessionData;
            },
            assign: async(obj) => {
                await sessionGet();
                sessionData = Object.assign(sessionData, obj);
                await redisSessionSet(sessionData);
                return sessionData;
            },
        }
        Object.defineProperty(session, 'get', {
            enumerable: true,
            get: async() => {
                if (sessionData === undefined) {
                    sessionData = await sessionGet();
                }
                return sessionData;
            }
        })
        Object.defineProperty(session, 'exists', {
            enumerable: true,
            get: async() => {
                return await redisSessionExists();
            }
        })
        Object.defineProperty(session, 'token', {
            enumerable: true,
            get: () => {
                return token;
            }
        })
        Object.defineProperty(session, 'data', {
            enumerable: true,
            get: () => {
                return data;
            }
        })
        return session;
    }

    this.boot = async() => {
        console.info(`${service.prefix} booted`)
    }

}

service.wants = ['redis'];
service.alias = 'session';

module.exports = service;