module.exports = async (app)  => {
    const express = require('express');
    const router  = express.Router();

    const login = require('../action/auth/login');
    const prolongate = require('../action/auth/prolongate');
    const verify = require('../action/auth/verify');

    const corifeus = require('../../../registry');

    router.use(corifeus.core.express.decorator.auth('public'));

    router.post('/login', login);
    router.get('/verify', verify);
    router.get('/prolongate', prolongate);

    return router;
};