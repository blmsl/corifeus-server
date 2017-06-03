const corifeus = require('../../../../registry');

module.exports =  async (req, res) => {
    const phantomJsKey = req.header('x-corifeus-render') || '';
    const phantomJsKeyRequires = corifeus.core.settings.boot.core.service.phantom.key || '';
    if (phantomJsKey !== phantomJsKeyRequires) {
        throw new Error(`Invalid PhantomJs Key ${phantomJsKey}`)
    }
    const url = req.params[0];
    try {
        const result = await corifeus.core.phantom.render(url);
        res.status(result.status).send(result.content);
    } catch(e) {
        res.error(e);
    }
}

