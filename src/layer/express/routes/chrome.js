module.exports = async (app)  => {
    const express = require('express');

    const render = require('../action/chrome/render');

    const router  = express.Router();
    const corifeus = require('../../../registry');
    router.use(corifeus.core.express.decorator.auth('public'));

    router.get('/render/*', render);

    return router;
};
