const cors = () => {
    return function(req, res, next) {
//        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Set-Cookie, X-Corifeus-Token, X-Corifeus-Token-Auto");
        res.header("Access-Control-Expose-Headers", "Set-Cookie, X-Corifeus-Token, X-Corifeus-Token-Auto");
        next();
    }
}

module.exports = cors;
