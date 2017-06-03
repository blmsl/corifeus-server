const express = require('express');
const router  = express.Router();
const corifeus = require('../../../registry');

module.exports = async (app)  => {
    const random = require('../action/util/random');

    router.get('/random/:length?', corifeus.core.express.decorator.auth('public', random));

    return router;
};