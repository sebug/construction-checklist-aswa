const multipart = require('multipart-formdata');
const sgMail = require('@sendgrid/mail');
const sharp = require('sharp');

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
    context.log('The header is ' + req.headers['content-type']);
    // Retrieve the boundary id
    const boundary = multipart.getBoundary(req.headers["content-type"]);
    context.log('the boundary is ' + boundary);
    if (boundary) {
	const parts = multipart.parse(req.body, boundary);
	
	context.log('The length is ' + parts.length);
	context.log(JSON.stringify(parts.map(p => p.name)));
	context.log('sharp is ' + sharp);

	sgMail.setApiKey(process.env.SENDGRID_API_KEY)
	const msg = {
            to: [ process.env.TO_EMAIL ], // Change to your recipient
            from: process.env.FROM_EMAIL, // Change to your verified sender
            subject: 'Contrôle construction',
            text: 'Easy text',
	    attachments: []
	};

	if (process.env.SECONDARY_TO_EMAIL) {
	    msg.to.push(process.env.SECONDARY_TO_EMAIL);
	}

	let nameOfConstruction = '';
	let date = '';
	let mailAddress = '';
	let hasToRepair = false;

	for (let part of parts) {
	    if (part && part.name) {
                switch (part.name) {
                case 'nameOfConstruction':
                    nameOfConstruction = new Buffer(part.field, 'ascii').toString('utf8');
                    msg.subject = msg.subject + ' ' + nameOfConstruction;
                    break;
                case 'date':
                    date = part.field;
                    break;
                case 'mailAddress':
                    mailAddress = part.field;
                    break;
                }
		if (part.field === 'torepair') {
		    hasToRepair = true;
		}
            }
	}

	// Send to ourselves just in case
	if (mailAddress && msg.to.filter(addr => addr === mailAddress).length === 0) {
	    msg.cc = [mailAddress];
	}



	if (hasToRepair && nameOfConstruction) {
	    msg.subject = 'A réparer: ' + nameOfConstruction;
	}


	let text = `Compte-rendu contrôle construction ${nameOfConstruction}
	établi par ${mailAddress} le ${date}
	`;
	let html = `<p><strong>Compte-rendu contrôle construction ${nameOfConstruction}</strong><br>
	    établi par ${mailAddress} le ${date}</p>
	    `;
	for (let part of parts) {
	    if (part && part.name) {
		if (part.name.indexOf('Comments') >= 0) {
                    // always add
                    text += part.field + '\n';
		    if (part.field) {
			html += '<p>' + new Buffer(part.field, 'ascii').toString('utf8') + '</p>';
		    } else {
			html += '<p>' + part.field + '</p>';
		    }
		} else if (fieldCodeToFieldName[part.name]) {
		    let fieldText = part.field;
		    if (fieldText === 'ok') {
			fieldText = 'Rien à signaler';
		    } else if (fieldText === 'torepair') {
			fieldText = 'À réparer';
		    }
                    const innerText = fieldCodeToFieldName[part.name] +
			  ': ' + fieldText;
                    text += innerText + '\n';
                    html += '<p>' + innerText + '</p>';
		} else if (part.name && part.name.indexOf('Photo') >= 0 && part.filename && part.data) {
		    const nonPhotoName = part.name.substring(0, part.name.indexOf('Photo'));
		    context.log('Got photo for ' + nonPhotoName);

		    let resizedBuffer = part.data;
		    try {

			resizedBuffer = await sharp(part.data).resize({ width: 480 }).toBuffer();
		    } catch (e) {
			context.log('Did not manage to resize image, attaching original');
			resizedBuffer = part.data;
		    }
		    
		    
		    msg.attachments.push({
			filename: part.filename,
			contentType: part.type,
			content: resizedBuffer.toString('base64'),
			content_id: nonPhotoName + 'cid',
			disposition: 'inline'
		    });
		    html += '<p><img src="cid:' + nonPhotoName + 'cid" /></p>';
		}
            }
	}

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
