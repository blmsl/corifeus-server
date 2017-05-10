const express = require('express');

const corifeus = require('../../registry');

const _ = require('lodash');

express.response.error = function(error) {

    if (this.req.corifeus.local) {
        console._error(`${corifeus.core.express.prefix }`, error);
        if (!(error instanceof Error)) {
            console.trace();
        }
    }

    let result = {
        status: 'error'
    }

    if (error instanceof Error) {
        ['name', 'message', 'code'].forEach((property) => {
            if (error.hasOwnProperty(property)) {
                result[property] = error[property];
            }
        })
        if (this.req.corifeus.local) {
            result.stack = error.stack;
        }
        if (error.hasOwnProperty('errors')) {
            Object.keys(error.errors).forEach((key) => {
                if (!this.req.corifeus.local) {
                    delete error.errors[key]['stack'];
                }
            })
            result.errors = error.errors;
        }
    } else if (typeof(error) === 'string') {
        result.message = error;
    } else {
        Object.assign(result, error);
    }
    this.status(500).send(result);

}

express.response.notFound = function(error) {
    this.status(404).send({
        status: 'not-found'
    });
}

express.response.ok = function(json) {
    if (_.hasIn(this.req, 'corifeus.session.token')) {
        const token = this.req.corifeus.session.token;
        this.set(corifeus.core.settings.token.header, token);
        this.cookie(corifeus.core.settings.token.cookie, token);
    } else {
        this.clearCookie(corifeus.core.settings.token.cookie);
    }

    this.status(200).send(Object.assign({
        status: 'ok'
    }, json))
}

