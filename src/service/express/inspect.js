const _ = require('lodash');

// todo make nested/recursive paths
exports.auth = (inspectee) => {
    let isAuthorized = false;

    const inspectHandle = (handle) => {
        if (_.hasIn(handle, 'corifeus.authorizator')) {
            if (handle.corifeus.authorizator == true) {
                return true;
            }
        }
        return false;
    }

    const inspectRouter = (router) => {
        for(let index = 0; index < router.stack.length; index++) {
            const layer = router.stack[index];
            if (inspectHandle(layer.handle)) {
                return true;
            }
        }
        return false;
    }

    if (inspectee.name === 'router') {
        isAuthorized = inspectRouter(inspectee);
    } else if (inspectee.name === 'app') {
        isAuthorized = inspectRouter(inspectee.router);
    } else {
        isAuthorized = inspectHandle(inspectee);
    }
    return isAuthorized;
}