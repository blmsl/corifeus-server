module.exports = require('corifeus-utils');

module.exports.alias = 'util';
module.exports.debounce = (debounce, cb) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            cb();
            resolve();
        }, debounce)
    })
}

