const { TableServiceClient, AzureNamedKeyCredential, TableClient } = require("@azure/data-tables");
const sgMail = require('@sendgrid/mail');
const sharp = require('sharp');
const nodemailer = require('nodemailer');

module.exports = async function (context, req) {
    try {
        const account = process.env.TABLES_STORAGE_ACCOUNT_NAME;
        const accountKey = process.env.TABLES_PRIMARY_STORAGE_ACCOUNT_KEY;
        const suffix = process.env.TABLES_STORAGE_ENDPOINT_SUFFIX;

        const d = new Date();
        context.log('Checking in on construction ' + req.query.construction + ' at ' + d.toISOString());

        const url = 'https://' + account + '.table.' + suffix;
    
        const credential = new AzureNamedKeyCredential(account, accountKey);
        const serviceClient = new TableServiceClient(
            url,
            credential
        );
    
        const tableName = 'checkouts';

        await serviceClient.createTable(tableName, {
            onResponse: (response) => {
                if (response.status === 409) {
                    context.log('Table checkouts already exists');
                }
            }
        });

        const tableClient = new TableClient(url, tableName, credential);
        const rowKey = d.toISOString();

        let entity = {
            partitionKey: "Prod",
            rowKey: rowKey,
            StartDate: d.toISOString(),
            Construction: req.query.construction
        };
        await tableClient.createEntity(entity);

        try {
            context.log('Sending checkout mail to ' + process.env.CHECKIN_MAIL_TO + ' from ' + process.env.FROM_EMAIL);
            sgMail.setApiKey(process.env.SENDGRID_API_KEY)
            const msg = {
                    to: [ process.env.CHECKIN_MAIL_TO ], // Change to your recipient
                    from: process.env.FROM_EMAIL, // Change to your verified sender
                    subject: 'Sorti construction ' + req.query.construction,
                    text: 'Sorti de la construction ' + req.query.construction + ' à ' + d.toISOString(),
                attachments: []
            };
            if (process.env.SECONDARY_TO_EMAIL) {
                msg.to.push(process.env.SECONDARY_TO_EMAIL);
            }
            if (process.env.USE_NODEMAILER === 'true') {
                const transporter = nodemailer.createTransport({
                    host: process.env.NODEMAILER_SMTP_HOST,
                    port: Number(process.env.NODEMAILER_SMTP_PORT),
                    secure: false,
                    auth: {
                    user: process.env.NODEMAILER_SMTP_USERNAME,
                    pass: process.env.NODEMAILER_SMTP_PASSWORD
                    }
                });
                const messageForNodemailer = {
                    from: process.env.NODEMAILER_SMTP_USERNAME, // Have to use the same from address as the message we are sending
                    to: msg.to.join(', '),
                    subject: msg.subject,
                    text: msg.text
                };
                await transporter.sendMail(messageForNodemailer);
            } else {
                const sendRes = await sgMail.send(msg);
                context.log('Send result is ' + sendRes);
            }
        } catch (sendException) {
            context.log('error sending mail ' + sendException);
            context.log(sendException);
            // On va quand-même rediriger
        }

        context.res = {
            status: 302,
            headers: {
                "Location": "/sortie.html?construction=" + encodeURIComponent(req.query.construction)
            },
            body: null
        };
    } catch (e) {
        context.log(e);

        context.res = {
            status: 500,
            body: '' + e
        };
    }
}