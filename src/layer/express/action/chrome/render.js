const corifeus = require('../../../../registry');

module.exports = async (req, res) => {
    const chromeJsKey = req.header('x-corifeus-render') || '';
    const chromeJsKeyRequires = corifeus.core.settings.boot.core.service.chrome.key || '';
    if (chromeJsKey !== chromeJsKeyRequires) {
        throw new Error(`Invalid chrome Key ${chromeJsKey}`)
    }

    let maxRetry = 5;
    let currentRetry = 0;
    let valid = false;
    let redisResult;
    try {

        const redisResultFunction = async () => {
            return await corifeus.core.redis.communicate.exec({
                channel: 'singleton',
                action: 'corifeus.core.chrome.render',
                request: req.params[0],
                timeout: corifeus.core.settings.boot.core.service.chrome.timeoutSeconds * 1000 * 2
            });
        }

        while (valid === false || currentRetry < maxRetry) {
            currentRetry++;
            redisResult = await redisResultFunction();
            if (redisResult.response.status !== undefined) {
                valid = true;
            }
        }
        const result = redisResult.response;
        res.setHeader('Last-Modified', result.lastModifiedDate);
        res.status(result.status).send(result.content);
    } catch (e) {
        if (redisResult && redisResult.response.status === undefined) {
            console.error(redisResult.response);
        }
        console.error(e)
        res.error(e);
    }
}

