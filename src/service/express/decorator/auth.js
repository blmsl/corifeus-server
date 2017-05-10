module.exports = (spec, action) => {

    const handle = async (req, res, next) => {
        let roles = [];

        if (req.corifeus.session !== undefined ) {
            const sessionExists = await req.corifeus.session.exists;
            if (sessionExists) {
                const session = await req.corifeus.session.get;
                roles = session.roles || [];
            }
        }
        if (spec !== 'public' && !roles.includes(spec)) {
            res.error('unauthorized');
        } else {
            if (action === undefined) {
                next();
            } else {
                await action(req, res);
            }
        }
    }
    handle.corifeus  = {
        authorizator: true
    };
    return handle;
}

