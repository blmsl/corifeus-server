const error = () => {
    return (err, req, res, next) => {
        res.error(err);
    }
}


module.exports = error;