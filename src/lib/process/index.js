process.on("unhandledRejection", (err, promise) => {
    console.error(`${module.exports.prefix} unhandledRejection:`, err);
    process.exit(1);
});

