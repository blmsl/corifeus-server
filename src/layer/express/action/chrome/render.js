const corifeus = require('../../../../registry');

module.exports =  async (req, res) => {
    const chromeJsKey = req.header('x-corifeus-render') || '';
    const chromeJsKeyRequires = corifeus.core.settings.boot.core.service.chrome.key || '';
    if (chromeJsKey !== chromeJsKeyRequires) {
        throw new Error(`Invalid chrome Key ${chromeJsKey}`)
    }
    const url = req.params[0];
    try {
        const result = await corifeus.core.chrome.render(url);
        res.status(result.status).send(result.content);
    } catch(e) {
        res.error(e);
    }
}

