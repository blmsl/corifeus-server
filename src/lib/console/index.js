const cluster = require('cluster');
const _ = require('lodash');

// overriding the console should be after this!!!
require('console-stamp')(console, {
    pattern: 'yyyy/mm/dd HH:MM:ss.l',
    metadata: function () {
        let base;
        if (cluster.isWorker) {
            base = `[WORKER ${_.padStart(cluster.worker.id, 3, 0)}]`
        } else {
            base = `[MASTER]`;
        }
        return `${base} [PID: ${process.pid}]`;
    },
    colors: {
        stamp: "cyan",
        label: "green",
        metadata: "red"
    }
});

const _error = console.error;
console._error = _error;

const settings = require('../settings');
const disableEmail = _.hasIn(settings.boot.core, 'lib.console.email') && settings.boot.core.lib.console.email === false;

const corifeus = require('../../registry');

console.debug = function() {
    if (corifeus.core.settings.debug) {
        console.info.apply(console.info, arguments)
    }
}
console.error = function() {
    if (!disableEmail) {
        try {
            corifeus.core.service.email.send({
                body: arguments,
                subject: 'error core'
            })
        } catch (e) {
            _error(`${module.exports.prefix} the email is not working: ${e.message}`)
        }
    }
    _error.apply(console, arguments);
}

