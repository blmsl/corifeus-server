module.exports.auto = async (app, root) => {
    const express = require('express');
    const fs = require('mz/fs');
    const router  = express.Router();
    const path = require('path');
    (await fs.readdir(root)).forEach((file) => {
        const url = file === 'index.js' ? '' : path.basename(file, '.js');
        router.get(`/${url}`, require(`${root}/${file}`) )
    });
    return router
}