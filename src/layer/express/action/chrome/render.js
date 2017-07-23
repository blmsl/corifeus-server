const corifeus = require('../../../../registry');

module.exports =  async (req, res) => {
    const chromeJsKey = req.header('x-corifeus-render') || '';
    const chromeJsKeyRequires = corifeus.core.settings.boot.core.service.chrome.key || '';
    if (chromeJsKey !== chromeJsKeyRequires) {
        throw new Error(`Invalid chrome Key ${chromeJsKey}`)
    }

    try {
        const redisResult = await corifeus.core.redis.communicate.exec({
            channel: 'singleton',
            action: 'corifeus.core.chrome.render',
            request: req.params[0],
            timeout: corifeus.core.settings.boot.core.service.chrome.timeoutSeconds * 1000 * 2
        });

        const result = redisResult.response;
        res.setHeader('Last-Modified', result.lastModifiedDate);
        res.status(result.status).send(result.content);
    } catch(e) {
        console.error(e)
        res.error(e);
    }
}

