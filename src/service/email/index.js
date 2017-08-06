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

    const send = async (from, to, subject, body) => {
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

        try {
            let transporter = nodemailer.createTransport(settings.nodemailer.config);
            const info = await transporter.sendMail(message);
            console.log(info.response);
            transporter.close();
        } catch (e) {
            console.log(`send error email`, message);
            console.error(e, message);
        }
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

        }
    };

    if (settings.nodemailer.singleton) {
        singletonInstance = factory;
    }
    return factory;
};

service.alias = 'email';

module.exports = service;
