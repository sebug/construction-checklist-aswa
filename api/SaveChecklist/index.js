const multipart = require('multipart-formdata');
const sgMail = require('@sendgrid/mail')

module.exports = async function (context, req) {
    context.log("Starting sending report e-mail");

    const body = req.rawBody;
    // Retrieve the boundary id
    const boundary = multipart.getBoundary(req.headers["content-type"]);
    context.log('the boundary is ' + boundary);
    if (boundary) {
      const parts = multipart.parse(body, boundary);
  
      context.log('The length is ' + parts.length);
      context.log(JSON.stringify(parts));

      sgMail.setApiKey(process.env.SENDGRID_API_KEY)
      const msg = {
          to: process.env.TO_EMAIL, // Change to your recipient
          from: process.env.FROM_EMAIL, // Change to your verified sender
          subject: 'Contrôle construction',
          text: 'Easy text'
      };

      let text = 'Compte-rendu contrôle construction';
      let html = '<p>Compte-rendu contrôle construction</p>';
      text += body;
      html += '<pre>' + body + '</pre>';

      msg.text = text;
      msg.html = html;

      await sgMail.send(msg);
      context.log('e-mail sent');
  
      context.res.status(200);
      context.res.body = JSON.stringify(parts);

    } else {
      context.res.status(500).send("No file(s) found.");
    }
}