const fs = require('mz/fs');

const corifeus = require('../../../../registry');

const utils = require('corifeus-utils');

module.exports = async(req, res) => {

    const stats = await corifeus.core.cluster.gatherStats();
    stats.master = stats.usage;
    stats.usage = undefined;

    const clusterStats = await corifeus.core.redis.communicate.exec({
        channel: 'master',
        action: 'corifeus.core.cluster.stats.master',
    });

    stats.cluster = clusterStats.response;


    const result = {
        alias: corifeus.core.alias,
        layers: {},
        corifeus: {},
        stats: stats,
    };
    Object.keys(corifeus).forEach((project) => {
        result.corifeus[project] = {};
        ['lib', 'service'].forEach((factory) => {
            Object.keys(corifeus[project][factory]).forEach((item) => {
                result.corifeus[project][factory] = result.corifeus[project][factory] || [];
                result.corifeus[project][factory].push(item)
            })
        })

    })

    const projects = Object.keys(corifeus.core.settings.boot);
    for (let index = 0; index < projects.length; index++ ) {
        const projectKey = projects[index];
        const project = corifeus.core.settings.boot[projectKey];
        const dirLayer = `${project.root}layer`;
        try {
            const dirs = await fs.readdir(dirLayer);
             result.layers[projectKey] = dirs;
        } catch (e) {
            if (e.code !== 'ENOENT') {
                throw e
            }
        }
    }

    res.ok({ registry: result})
}