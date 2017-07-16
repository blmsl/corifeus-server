const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');

const corifeus = require('../../registry');

const utils = require('corifeus-utils');

const service = function(settings) {
    const consolePrefix = service.prefix;

    console.info(`${consolePrefix} started`);

    const globalSettings = corifeus.core.lib.settings.boot;

    Object.keys(globalSettings).forEach((schemaRoot) => {

        const dir = globalSettings[schemaRoot].root + `layer/mongoose/schema`;
        const dirFile =  path.resolve(`${dir}`)
        if (!fs.existsSync(dirFile)) {
            return false;
        }
        const files = fs.readdirSync(dirFile);
        files.forEach((schemaFile) => {
            const requireFile = `${dirFile}/${schemaFile}`;
            const schemaName = schemaFile.substring(0, schemaFile.length - 3);
            const modelName = _.kebabCase(`${schemaRoot} ${schemaName}`);
            console.info(`${consolePrefix} SCHEMA: ${modelName}`);
            const schema = require(requireFile);
            mongoose.model(modelName, schema);
        })
    })
    mongoose.set('debug', true);
    mongoose.Promise = global.Promise;


    let resolver, rejecter;
    mongoose.connection.on('error', function (err) {
        console.error(`${consolePrefix} connection error: `, err);
    });


    this.boot = () => {
        this.instance = mongoose;

        const { resolve, reject, promise } = utils.promise.deferred();

        this.stats = {
            models: mongoose.modelNames()
        }
        mongoose.connect(settings.url, {
            useMongoClient: true
        });

        const waitForSometime = setTimeout(() => {
            reject();
        }, 5000)

        mongoose.connection.on('connected', function () {
            console.info(`${consolePrefix} ready`)
            clearTimeout(waitForSometime);
            resolve();
        });

        mongoose.connection.on('error', function (err) {
            console.error('${consolePrefix error', err);
        });

        return promise;
    }
}

service.alias = 'mongoose';

module.exports = service;