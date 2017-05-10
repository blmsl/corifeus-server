const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const path = require('path');
const fs = require('mz/fs');
const cookieParser = require('cookie-parser')

// order is important here
const errorMiddleware = require('./middleware/error');
const corifeusMiddleware = require('./middleware/corifeus');
const sessionAuthMiddleware = require('./middleware/session-auth');
const corsMiddleware = require('./middleware/cors');

const inspect = require('./inspect');

require('./response');
require('./request');

const corifeus = require('../../registry');

const service = function (settings) {

    this.decorator = service.decorator;
    this.lib = service.lib;

    this.boot = async () => {
        console.info(`${service.prefix} started`);

        const app = express();

        // order is important here
        app.use(corifeusMiddleware({
            connectors: [
                require('./middleware/connector/logger')
            ]
        }));
        app.use(cookieParser())

        app.use(bodyParser.json());

        app.use(sessionAuthMiddleware());

        app.use(errorMiddleware());

        app.use(corsMiddleware());


        // public
        const publicPath = path.normalize(`${process.cwd()}/${settings.public}`);
        console.info(`${service.prefix} static path: ${publicPath}`);
        app.use('/public', express.static(publicPath));

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

            const layerRoot = project === 'core' ? 'service' : 'layer';

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

        this.stats = {
            routes: registryRoutes,
        }

        app.all('**', (req, res) => res.notFound());


        let resolver, rejecter;
        app.listen(settings.port, () => {
            console.info(`${service.prefix} ready`);
            resolver();
        })

        return new Promise((resolve, reject) => {
            resolver = resolve;
            rejecter = reject;
        })
    }
};

service.wants = ['mongoose', 'redis', 'phantom', 'session'];
service.alias = 'express';

if (_.hasIn(corifeus, 'core.loader.loadLibSync')) {
    service.decorator = corifeus.core.loader.loadLibSync(`${__dirname}/decorator`);
    service.lib = corifeus.core.loader.loadLibSync(`${__dirname}/lib`);
} else {
    console.log('This cannot happen!!! :)');
    process.exit();
}

module.exports = service