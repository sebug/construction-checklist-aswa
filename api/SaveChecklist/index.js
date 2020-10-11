const multipart = require('multipart-formdata');
const sgMail = require('@sendgrid/mail');
const mail = require('@sendgrid/mail');

const fieldCodeToFieldName = {
    'illumination': 'Éclairage (changement ampoules et néons)',
    'hygrometrie': 'Hygrométrie + Température',
    'kitchen': 'Matériel électrique cuisine',
    'water': 'Eau (robinet, WC, Douche)',
    'access': 'Nettoyage des Accès (Entrée, Saut de Loup',
    'floor': 'Remplir les grilles de sol',
    'generator': 'Faire tourner le générateur aux. 4x/an',
    'controllist': 'Remplir la fiche contrôle',
    'dehumidifier': 'Contrôler déshumidificateur'
};

module.exports = async function (context, req) {
    context.log("Starting sending report e-mail");

    const body = req.body;
    // Retrieve the boundary id
    const boundary = multipart.getBoundary(req.headers["content-type"]);
    context.log('the boundary is ' + boundary);
    if (boundary) {
      const parts = multipart.parse(req.body, boundary);
  
      context.log('The length is ' + parts.length);
      context.log(JSON.stringify(parts));

      sgMail.setApiKey(process.env.SENDGRID_API_KEY)
      const msg = {
          to: process.env.TO_EMAIL, // Change to your recipient
          from: process.env.FROM_EMAIL, // Change to your verified sender
          subject: 'Contrôle construction',
          text: 'Easy text'
      };

      let nameOfConstruction = '';
      let date = '';
      let mailAddress = '';

      parts.forEach(part => {
            if (part && part.name) {
                switch (part.name) {
                    case 'nameOfConstruction':
                        nameOfConstruction = part.field;
                        msg.subject = msg.subject + ' ' + nameOfConstruction;
                        break;
                    case 'date':
                        date = part.field;
                        break;
                    case 'mailAddress':
                        mailAddress = part.field;
                        break;
                }
            }
      });

      let text = `Compte-rendu contrôle construction ${nameOfConstruction}
      établi par ${mailAddress} le ${date}
      `;
      let html = `<p><strong>Compte-rendu contrôle construction ${nameOfConstruction}<strong><br>
      établi par ${mailAddress} le ${date}</p>
      `;
      parts.forEach(part => {
          if (part && part.name) {
              if (part.name.indexOf('Comments') >= 0) {
                  // always add
                  text += part.field + '\n';
                  html += '<p>' + part.field + '</p>';
              } else if (fieldCodeToFieldName[part.name]) {
                  const innerText = fieldCodeToFieldName[part.name] +
                    ': ' + part.field;
                  text += innerText + '\n';
                  html += '<p>' + innerText + '</p>';
              }
          }
      });

      msg.text = text;
      msg.html = html;

      await sgMail.send(msg);
      context.log('e-mail sent');
  
      context.res.status(200);
      context.res.body = 'Checklist envoyée.';

    } else {
      context.res.status(500).send("No file(s) found.");
    }
}