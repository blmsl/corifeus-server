const Redis = require('ioredis');
const url = require('url');
const utils = require('corifeus-utils');

function service(settings) {

    const self = this;
    const consolePrefix = service.prefix

    console.info(`${consolePrefix} started`);

    this.new = () => {
        return new Redis(settings.url);
    }

    this.client = undefined;

    const prefixes = {};


    this.stats = {
    }

    Object.defineProperty(this.stats, 'prefix', {
        enumerable: true,
        get: () => {
            return Object.keys(prefixes)
        }
    })

    this.register = {
        prefix: (prefix, depth = 0) => {

            if (!prefixes.hasOwnProperty(prefix)) {
                console.info(`${service.prefix} prefix registered: ${prefix}`);
                prefixes[prefix] = true;
                return `${prefix}:`
            }
            console.error(`${service.prefix} multiple prefix: ${prefix}`);
            depth++;
            prefix = `${prefix}${depth}`;
            return this.registerPrefix(prefix, depth);
        }
    }

    this.register.prefix.reuse = (prefix) => {
        if (prefix.hasOwnProperty(prefix)) {
            return prefix;
        }
        return this.register.prefix(prefix);
    }

    this.boot = async () => {

        const redisUrl = new url.URL(settings.url);

        return new Promise((resolve, reject) => {
            const client = this.new();
            client.on('ready', async() => {
                console.info(`${consolePrefix} ready`)
                this.client = client;
                resolve();
            })
            client.on('error', async(e) => {
                console.error(`${consolePrefix} error`)
                reject(e);
            })
        })
    }

    this.communicate = require('./communicate')({
        instance: this,
        factory: service
    });

}

service.alias = 'redis';

module.exports = service;