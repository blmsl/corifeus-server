const corifeus = require('../../registry');

module.exports = async() => {
    const stats = {};
    await Object.keys(corifeus).forEachAsync(async (project) => {
        stats[project] = {};
        await ['service', 'lib'].forEachAsync(async(type ) => {
            await Object.keys(corifeus[project][type]).forEachAsync(async (module) => {
                const moduleInstance = corifeus[project][type][module];
                if (moduleInstance.hasOwnProperty('stats')) {
                    stats[project][type] = stats[project][type] || {};
                    stats[project][type][module] = await corifeus[project][type][module].stats;
                }
            })
        })
    })
    return stats;
}