const crypto = require('mz/crypto');

const divider = '-';

const corifeus = require('../../registry');
const utils = require('corifeus-utils');

const ms = require('pretty-ms');
const moment = require('moment');

const verbose = (data) => {
    return utils.time.verbose(data.expiry, data.started);
}

exports.sign = async (jsonObject, expiryArg = true) => {

    const settings = corifeus.core.settings;

    const secret = await corifeus.core.redis.client.getBuffer(settings.redis.prefix.cluster.auth.secret)

    const hashCrypto = crypto.createHmac('sha512', secret);
    const now = new Date().getTime();

    let expiry;
    if (expiryArg === true ) {
        expiry = now + (settings.boot.core.lib.auth.token.expiryMinutes * 60 * 1000);
    } else if (typeof expiryArg === "number" ) {
        expiry = now + expiryArg
    }

    const data = {
        payload: jsonObject,
        started: now,
        expiry: expiry
    };
    const jsonString = JSON.stringify(data);
    hashCrypto.update(jsonString)
    const hash = hashCrypto.digest(settings.boot.core.encoding);
    const result = {
        token: `${new Buffer(jsonString).toString(settings.boot.core.encoding)}${divider}${hash}`,
        data: data,
        verbose: verbose(data)
    };


    return result;
}

exports.verify = async(token) => {
    const settings = corifeus.core.settings;

    // todo add use a pure redis function instead of readis function, use its own - tokenSession service
    const secret = await corifeus.core.redis.client.getBuffer(settings.redis.prefix.cluster.auth.secret)

    let [data, hash] = token.split(divider);
    data = new Buffer(data, settings.boot.core.encoding).toString();
    const hashCrypto = crypto.createHmac('sha512', secret)
    hashCrypto.update(data)
    const hashCheck = hashCrypto.digest(settings.boot.core.encoding);

    if (hash !== hashCheck) {
        throw Error('invalid token')
    }
    data = JSON.parse(data);
    const now = new Date().getTime();
    if (now > data.expiry) {
        throw Error('expired')
    }
    return {
        verbose: verbose(data),
        data: data,
    };
}

exports.prolongate = async (token) => {
    let verifyData = await exports.verify(token)
    return exports.sign(verifyData.data.payload);
}

exports.auto = async(username, expiryArg ) => {
    expiryArg = expiryArg || corifeus.core.util.time.span('1 week');
    const autoData = exports.sign({
        username: username,
        random: await corifeus.core.util.random(32)
    }, expiryArg);
    return autoData;
}