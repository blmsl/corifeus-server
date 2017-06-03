const corifeus = require('../../registry');
const prettyBytes = require('pretty-bytes');

const utils = require('corifeus-utils');

module.exports = async() => {
    const stats = {};
    await Object.keys(corifeus).forEachAsync(async (project) => {
        stats[project] = {};
        await ['service', 'lib'].forEachAsync(async(type ) => {
            await Object.keys(corifeus[project][type]).forEachAsync(async (module) => {
                const moduleInstance = corifeus[project][type][module];
                if (moduleInstance.hasOwnProperty('stats')) {
                    stats[project][type] = stats[project][type] || {};
                    const executer = corifeus[project][type][module].stats;
                    let statInfo = typeof executer === 'function' ? await executer() : await executer;
                    stats[project][type][module] = statInfo;
                }
            })
        })
    })

    const { promise, resolve, reject} = utils.promise.deferred();

    stats.usage = {
        cpu: process.cpuUsage(),
        hrtime: process.hrtime(),
    }

    setTimeout(() => {

        stats.usage = {
            cpu: process.cpuUsage(stats.usage.cpu),
            hrtime: process.hrtime(stats.usage.hrtime),
            memory: process.memoryUsage(),
        }

        stats.usage.memoryHuman = {
            rss: prettyBytes(stats.usage.memory.rss),
            heapTotal: prettyBytes(stats.usage.memory.heapTotal),
            heapUsed: prettyBytes(stats.usage.memory.heapUsed),
            external: prettyBytes(stats.usage.memory.external),
        }

        resolve(stats)
    }, 1000)

    return promise;
}