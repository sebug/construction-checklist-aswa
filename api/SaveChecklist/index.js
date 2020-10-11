const multipart = require('multipart-formdata');
const sgMail = require('@sendgrid/mail')

module.exports = async function (context, req) {
    context.log("Returns the result of the function.");

    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    const msg = {
        to: process.env.TO_EMAIL, // Change to your recipient
        from: process.env.FROM_EMAIL, // Change to your verified sender
        subject: 'Contrôle construction',
        text: 'Easy text',
        html: '<strong>easy</string> text',
    };
    await sgMail.send(msg);
    context.log('e-mail sent');

    const body = req.rawBody;
    // Retrieve the boundary id
    const boundary = multipart.getBoundary(req.headers["content-type"]);
    if (boundary) {
      const parts = multipart.parse(body, boundary);
  
      context.log(parts);
  
      context.res.status(200);
      context.res.body = 'Formulaire envoyé';

    } else {
      context.res.status(500).send("No file(s) found.");
    }
}