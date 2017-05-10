const crypto = require('mz/crypto');

const start = async(length = 128) => {
    const bytes = await crypto.randomBytes(length / 2)
    const base64 = bytes.toString('hex');
    console.log(base64);
}

for (let count = 0; count < 100; count++ ) {
    start(128);
}
