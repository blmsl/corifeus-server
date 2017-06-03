const nodemailer = require('nodemailer');
const os = require('os');

let singletonInstance;

const corifeus = require('../../registry');

const service = function(settings) {

    const consolePrefix = service.prefix;

    console.info(`${consolePrefix} started`);

    if (settings.nodemailer.singleton && singletonInstance !== undefined) {
        return singletonInstance;
    }

    const transporter = nodemailer
        .createTransport(settings.nodemailer.config);

    const send = (from, to, subject, body) => {
        if (body === undefined) {
            body = subject;
            subject = '';
        }

        const bodyBase =  `
<strong>${new Date().toLocaleString()}</strong>
<br/><br/>
<strong>PID:</strong> ${process.pid}
`
        if (Array.isArray(body) && body.length === 1 && body[0] instanceof Error) {
            body = body[0]
        }

        if (body instanceof Error) {

            body = `
${bodyBase}
<pre>            
Error: ${body.message}
${body.stack}
</pre>            
            `            
        } else if (typeof body === 'object') {
            body = `
${bodyBase}
<br/>
JSON:
<pre>
${JSON.stringify(body, null, 2)}
</pre>            
            `

        }
        
        const message = {
            from: from,
            to: to,
            subject: subject,
            html: body
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
            let {body, subject, from, to} = options;

            from = from || settings.email.from
            to = to || settings.email.to

            subject = `${settings.prefix}: ${corifeus.core.settings.instance} - ${subject}`;
            send(from, to, subject, body);
        },
        boot: async () => {
            await transporter.verify();
        }
    };

    if (settings.nodemailer.singleton) {
        singletonInstance = factory;
    }
    return factory;
};

service.alias = 'email';

module.exports = service;
