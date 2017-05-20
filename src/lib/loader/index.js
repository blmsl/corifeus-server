const fs = require('fs');
const path = require('path');
const cluster = require('cluster');

const _ = require('lodash');

const utils = require('corifeus-utils');

const corifeus = require('../../registry');

const bootLoader = async (type) => {
    const boot = require('../settings').boot;
    const namespaces = Object.keys(boot);
    for(let index = 0; index < namespaces.length; index++) {
        const namespace = _.camelCase(namespaces[index]);
        const project = boot[namespace];
        const root = path.normalize(`${process.cwd()}/${project.root}`);
        await loader(root, namespace, type)
    }
}

const loader = async (rootPath, namespace, type, whitelist = []) => {
    const consolePrefix = `[LOADER] [${type.toUpperCase()}] [${_.kebabCase(namespace).toUpperCase()}]`;


    if (fs.existsSync(`${rootPath}/${type}/`)) {
        console.info(`${consolePrefix} started`)

        corifeus[namespace] = corifeus[namespace] || {};
        corifeus[namespace][type] = corifeus[namespace][type] || {};

        const loadedModules = [];
        fs.readdirSync(`${rootPath}/${type}/`).forEach((module) => {
            if (whitelist.length > 0 && !whitelist.includes(module)) {
                return;
            }
            let loader;

            if (module.endsWith('.js')) {
                return;
            }
            loader = require(`${rootPath}/${type}/${module}`);

            module = _.camelCase(module);

            let wants = [];
            if (loader.hasOwnProperty('wants')) {
                if (Array.isArray(loader.wants)) {
                    wants = wants.concat(loader.wants)
                } else {
                    wants.push(loader.wants);
                }
            }
            loadedModules.push({
                name: module,
                loader: loader,
                wants: wants
            })
        });

        const modules = utils.require.resovleDependencies(loadedModules);

        if (modules.length > 0) {
            console.info(`${consolePrefix} loading in order: ${modules.map((module) => module.name).join(', ')}`);
            console.info('');
        }

        for(let index = 0; index < modules.length; index++ ) {
            const module = modules[index];
            console.info(`${consolePrefix} loading: ${module.name}`);

            const moduleNameDisplay = _.kebabCase(module.name);
            const consolePrefixModule = `${consolePrefix} [${moduleNameDisplay.toUpperCase()}]`;
            if ( !module.loader.hasOwnProperty('loaded')) {
                if (module.loader.hasOwnProperty('prefix')) {
                    throw new Error(`${consolePrefixModule} 'prefix' is by the framework, please do not use`);
                }
                if (module.loader.hasOwnProperty('settings')) {
                    throw new Error(`${consolePrefixModule} 'settings' is by the framework, please do not use`);
                }
                if (module.loader.hasOwnProperty('loaded')) {
                    throw new Error(`${consolePrefixModule} 'loaded' is by the framework, please do not use`);
                }
            }

            module.loader.prefix = `[${namespace.toUpperCase()}] [${type.toUpperCase()}] [${moduleNameDisplay.toUpperCase()}]`;
            console.info(`${consolePrefixModule} prefix: ${module.loader.prefix} `)

            const loadAlias = () => {
                /**
                 * Alias loading
                 */
                if (module.loader.hasOwnProperty('alias') && !module.loader.hasOwnProperty('loaded')) {
                    if (corifeus[namespace].hasOwnProperty(module.loader.alias)) {
                        throw new Error(`${consolePrefixModule} ${module.name} service.alias is already existing (${corifeus.core.alias[`corifeus.core.${module.loader.alias}`]}), please choose different alias`)
                    }
                    corifeus.core.alias[`corifeus.${namespace}.${module.loader.alias}`] = `corifeus.${namespace}.${type}.${module.name}`;
                    corifeus[namespace][module.loader.alias] = corifeus[namespace][type][module.name];
                    console.info(`${consolePrefixModule} alias: corifeus.${namespace}.${module.loader.alias}  `)
                }
            }

            if (type === 'lib') {
                Object.defineProperty(module.loader, 'settings', {
                    get: () => {
                        return corifeus.core.lib.settings.boot[namespace][type][module.name];
                    }
                })
                corifeus[namespace][type][module.name] = module.loader;


            } else {
                const settings = corifeus.core.settings.boot[namespace][type][module.name];

                let serviceInstance;

                const preload = () => {
                    if ( !module.loader.hasOwnProperty('loaded')) {
                        if (serviceInstance.hasOwnProperty('factory')) {
                            throw new Error(`${consolePrefixModule} 'service.factory' is by the framework, please do not use`);
                        }
                        if (serviceInstance.hasOwnProperty('prefix')) {
                            throw new Error(`${consolePrefixModule} 'serviceInstance.prefix' is by the framework, please do not use`);
                        }
                        if (serviceInstance.hasOwnProperty('settings')) {
                            throw new Error(`${consolePrefixModule} 'serviceInstance.settings' is by the framework, please do not use`);
                        }

                    }
                    serviceInstance.factory = module.loader;
                    serviceInstance.prefix = module.loader.prefix;
                    serviceInstance.settings = settings;
                }

                if (typeof(corifeus[namespace][type][module.name]) !== 'undefined') {
                    serviceInstance = corifeus[namespace][type][module.name]
                } else {
                    serviceInstance = new module.loader(settings);
                    corifeus[namespace][type][module.name] = serviceInstance;
                    preload();
                    loadAlias();
                    await serviceInstance.boot();
                }

                console.info('')
            }

            console.info(`${consolePrefixModule} settings: corifeus.${namespace}.${type}.${module.name}.settings `)

            if (type === 'lib') {
                loadAlias();
            }

            console.info('');

            module.loader.loaded = true;

        }

        console.info(`${consolePrefix} ${type} ready`)
        console.info('');
    }

}

bootLoader.loader = loader;

bootLoader.loadLib = async(dir) => {
    const dirs = await fs.readdir(dir);
    const modules = {};
    dirs.forEach((item) => modules[path.basename(item, '.js')] = require(`${dir}/${item}`));
    return modules;
}

bootLoader.loadLibSync = (root) => {
    const libs = {};
    fs.readdirSync(`${root}`).forEach((file) => {
        libs[path.basename(file, '.js')] = require(`${root}/${file}`)
    });
    return libs;
}

bootLoader.alias = 'loader'

module.exports = bootLoader;
