const cluster = require('cluster');

const clusterLoader =  async () => {

    if (cluster.isMaster) {
        const master = require('./main/master');
        master();
    } else {
        switch(process.env.CORIFUES_SERVER_COMMAND) {
            case 'worker':
                const worker = require('./main/worker');
                worker();
                break;

            case 'singleton':
                const singleton = require('./main/singleton');
                singleton();
                break;

            default:
                throw new Error(`Unknown fork command: ${process.env.CORIFUES_SERVER_COMMAND}`)
        }
    }

};


clusterLoader.stats = require('./stats');

clusterLoader.gatherStats = require('./gather-stats');

clusterLoader.alias = 'cluster'

clusterLoader.fork = (type) => {
    cluster.fork({
        'CORIFUES_SERVER_COMMAND': type
    })
}

module.exports = clusterLoader;
