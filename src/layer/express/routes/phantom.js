
module.exports = async (app)  => {

    const corifeus = require('../../../registry');
    const _ = require('lodash');

    if (_.hasIn(corifeus, 'core.settings.boot.core.service.phantom.enabled') && corifeus.core.settings.boot.core.service.phantom.enabled === false) {
       return undefined;
    }

    const express = require('express');

    const render = require('../action/phantom/render');

    const router  = express.Router();
    router.use(corifeus.core.express.decorator.auth('public'));

    router.get('/render/*', render);

    return router;
};
