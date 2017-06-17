const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const path = require('path');
const fs = require('mz/fs');
const cookieParser = require('cookie-parser')
const cors = require('cors');

// order is important here
const errorMiddleware = require('./middleware/error');
const sessionAuthMiddleware = require('./middleware/session-auth');
const inspect = require('./inspect');

require('./response');
const corifeus = require('../../registry');

const utils = require('corifeus-utils');

const service = function (settings) {

    this.decorator = corifeus.core.lib.express.decorator;


    this.middleware = () => {

        const app = this.app;

        app.disable('x-powered-by');

        const corsHeaders = [
            corifeus.core.settings.token.header,
            corifeus.core.settings.token.auto.header,
            'content-type',
        ];

        const corsSettings = {
            "origin": "*",
            "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
            credentials: true,
            exposedHeaders: corsHeaders,
            allowedHeaders: corsHeaders,
        };
//        console.debug(service.prefix, 'cors', corsSettings);
        app.use(cors(corsSettings))

        // order is important here
        app.use(corifeus.core.lib.express.middleware.corifeus({
            connectors: [
                corifeus.core.lib.express.middleware.corifeus.connector.logger(service.prefix)
            ]
        }));
        app.use(cookieParser())

        app.use(bodyParser.json());

        app.use(sessionAuthMiddleware());

        app.use(errorMiddleware());
    }

    this.routes = async () => {
        const app = this.app;

        // load routes and child apps
        const registryRoutes = {};
        const projects = corifeus.core.lib.settings.boot;
        const projectKeys = Object.keys(projects)

        // todo make nested/recursive paths
        for (let projectKeyIndex = 0; projectKeyIndex < projectKeys.length; projectKeyIndex++) {
            const project = projectKeys[projectKeyIndex];

            console.info('')
            console.info(`${service.prefix} [${project}]`)

            // ********** main middle
            let isAuthorizedProjectApp = false;
            const projectApp = express();

            const layerRoot = 'layer';

            const projectAppFile =  path.resolve(projects[project].root + `${layerRoot}/express/app.js`);
            if (fs.existsSync(projectAppFile)) {
                await require(projectAppFile)(projectApp, app);
                console.info(`${service.prefix} [${project}] app registered`)
                isAuthorizedProjectApp = inspect.auth(projectApp);
            }
            const projectRouteDir = path.resolve(
                projects[project].root + `${layerRoot}/express/routes`
            )
            if (!fs.existsSync(projectRouteDir)) {
                continue;
            }
            const projectRoutePaths = fs.readdirSync(projectRouteDir);

            for (let projectRoutePathsIndex = 0; projectRoutePathsIndex < projectRoutePaths.length; projectRoutePathsIndex++) {
                const projectRoutePathJs = projectRoutePaths[projectRoutePathsIndex];
                const projectRoutePath = projectRoutePathJs.substring(0, projectRoutePathJs.length - 3);

                // use the child app and the main app
                // ********** main middle
                const projectAppRoutePathRouter = await require(`${projectRouteDir}/${projectRoutePathJs}`)(projectApp, app);

                if (!projectAppRoutePathRouter) {
                    continue;
                }

                let isAuthorizedProjectRoutePathRouter = inspect.auth(projectAppRoutePathRouter);

                projectApp.use(`/${projectRoutePath}`, projectAppRoutePathRouter);

                const projectRoutePathRoot = `/api/${project}/${projectRoutePath}`;

                projectAppRoutePathRouter.stack.forEach((projectAppRoutePathRouterItem) => {

                    // **** router use
                    if (projectAppRoutePathRouterItem.route === undefined) {
                        return;
                    }
                    const projectRoutePathRootComplete = `${projectRoutePathRoot}${projectAppRoutePathRouterItem.route.path}`;

                    const methods = `${Object.keys(projectAppRoutePathRouterItem.route.methods).join(', ').toUpperCase()}`;
                    registryRoutes[projectRoutePathRootComplete] = methods;
                    console.info(`${service.prefix } ${methods} ${projectRoutePathRootComplete}`);

                    projectAppRoutePathRouterItem.route.stack.forEach((projectAppRoutePathRouterItemChild) => {

                        const projectAppRoutePathRouterItemChildHandle = projectAppRoutePathRouterItemChild.handle;
                        let isAuthorizedProjectAppRoutePathRouterItemChildHandle = inspect.auth(projectAppRoutePathRouterItemChildHandle);

                        let asyncHandleDecorator = async (req, res, next) => {
                            try {
                                await projectAppRoutePathRouterItemChildHandle(req, res, next);
                            } catch (e) {
                                res.error(e);
                            }
                        };

                        if (!isAuthorizedProjectAppRoutePathRouterItemChildHandle && !isAuthorizedProjectRoutePathRouter && !isAuthorizedProjectApp) {
                            asyncHandleDecorator = this.decorator.auth('admin', asyncHandleDecorator);
                        }

                        // ********** main middle
                        projectAppRoutePathRouterItemChild.handle = asyncHandleDecorator

                    })
                })

                app.use(`/api/${project}`, projectApp);
            }
        }
        return registryRoutes;
    }

    this.boot = async () => {
        console.info(`${service.prefix} started`);

        const app = express();
        this.app = app;

        this.middleware();

        // public
        const publicPath = path.normalize(`${process.cwd()}/${settings.public}`);
        console.info(`${service.prefix} static path: ${publicPath}`);
        app.use('/public', express.static(publicPath));

        const registryRoutes= await this.routes();

        this.stats = {
            routes: registryRoutes,
        }

        app.all('**', (req, res) => res.notFound());

        const { resolve, reject, promise } = utils.promise.deferred();

        app.listen(settings.port, () => {
            console.info(`${service.prefix} ready on ${settings.port}`);
            resolve();
        })

        return promise;
    }
};

service.wants = ['mongoose', 'redis', 'session', 'chrome', 'phantom'];
service.alias = 'express';

module.exports = service