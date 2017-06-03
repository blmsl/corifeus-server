const utils = require('corifeus-utils');

process.on("unhandledRejection", function(err, promise) {

    console.error.apply(console.error, [
        new Date().toLocaleString(),
        'unhandledRejection'
        ].concat(
            utils.array.isfy(arguments)
        )
    );
});

process.on('uncaughtException', function (err) {

    console.error.apply(console.error, [
            new Date().toLocaleString(),
            'unhandledRejection'
        ].concat(
         utils.array.isfy(arguments)
        )
    );
});
