const nodemailer = require('nodemailer');
const os = require('os');
const moment = require('moment');

let singletonInstance;


const service = function(settings) {

    const consolePrefix = service.prefix;

    console.info(`${consolePrefix} started`);

    let resolver;
    let rejecter;
    const bootPromise = new Promise((resolve, reject) => {
        resolver = resolve;
        rejecter = reject;
    })

    if (settings.nodemailer.singleton && singletonInstance !== undefined) {
        return singletonInstance;
    }

    const transporter = nodemailer
        .createTransport(settings.nodemailer.config);

    let verified = false;
    transporter.verify()
        .then(() => {
            verified = true;
            console.info(`${consolePrefix} ready.`);
            resolver(verified);
        })
        .catch((error) => {
            console.error(`${consolePrefix} error.`, error);
            verified = false;
            rejecter(verified);
        });

    const send = (from, to, subject, body) => {
        if (body === undefined) {
            body = subject;
            subject = '';
        }
        const momentify = (js) => {
            return Object.assign({
                timestamp: moment().format(settings.moment)
            }, js)
        }

        if (typeof body !== 'string') {
            body = momentify(body);
            body = JSON.stringify(body, null, 2);
        } else {
            body = `
${moment().format(settings.moment)}

${body}
`;
        }

        const message = {
            from: from,
            to: to,
            subject: subject,
            text: body
        };
        console.debug(`${consolePrefix} send new mail subject: ${subject}`);
        transporter.sendMail(message)
            .then((info) => {
                console.info(info.response);
            })
            .catch((error) => {
                console.debug(`${consolePrefix} send error email`);
                console.error(error);
            });
    }

    const factory = {
        send: (options) => {
            let {body, subject} = options;
            subject = `${settings.prefix}: ${os.hostname()} - ${subject}`;
            send(settings.email.from, settings.email.to, subject, body);
        },
        boot: async () => {
            await bootPromise;
        }
    };

    if (settings.nodemailer.singleton) {
        singletonInstance = factory;
    }
    return factory;
};

service.alias = 'email';

module.exports = service;
