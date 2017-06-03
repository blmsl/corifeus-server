const corifeus = require('../../registry');
const cluster = require('cluster');

const stats = async() => {
    return {};
}

stats.master = async () => {
    const workers = Object.keys(cluster.workers).length;

    const results = await corifeus.core.redis.communicate.exec({
        action: 'corifeus.core.cluster.gatherStats',
        channel: 'worker',
        multi: workers,
    });

    let pageCount = 0;
    const usage = {};
    results.response.forEach((response, index) => {
        pageCount += response.core.service.phantom.pageCount;
        Object.keys(response.usage).forEach((key) => {
            usage[key] = usage[key] || {};
            usage[key][index] = response.usage[key];
        })
    })

    const stats = {
        workers: workers,
        pageCount: pageCount,
        usage: usage
    };

    return stats;
}

module.exports = stats;