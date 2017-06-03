const express = require('express');
const router  = express.Router();
const corifeus = require('../../../registry');

module.exports = async (app)  => {

    if (corifeus.core.settings.debug) {
        router.get('/kill', (req, res) => {
            process.exit(1);
        });

        return router;
    }
    return;

};