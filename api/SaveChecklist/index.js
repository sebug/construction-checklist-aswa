const multipart = require('multipart-formdata');
const sgMail = require('@sendgrid/mail');
const sharp = require('sharp');
const { TableServiceClient, AzureNamedKeyCredential, TableClient, TableQuery } = require("@azure/data-tables");

const fieldCodeToFieldName = {
    'illumination': 'Éclairage (changement ampoules et néons)',
    'hygrometrie': 'Hygrométrie + Température',
    'kitchen': 'Matériel électrique cuisine',
    'water': 'Eau (robinet, WC, Douche, Lavabo)',
    'access': 'Nettoyage des Accès (Entrée, Saut de Loup)',
    'floor': 'Remplir les grilles de sol',
    'generator': 'Faire tourner le générateur aux. 1H ou Moteurs de la Ventilation 15minutes',
    'controllist': 'Remplir la fiche contrôle',
    'dehumidifier': 'Contrôler déshumidificateur',
	'gifas': 'Lampes Gifas/Contrôler',
	'enveloppe': 'Contrôler l\'enveloppe de l\'Abri',
	'joints': 'Contrôler l\'état des joints de Portes'
};

const isGlobalCode = (accessCode) => {
	if (Number(accessCode) === Number(process.env.GLOBAL_CODE)) {
		return true;
	}
	return false;
};

const checkAccessCodeValidity = async (context, construction, accessCode) => {
	if (isGlobalCode(accessCode)) {
		return true;
	}

    const account = process.env.TABLES_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.TABLES_PRIMARY_STORAGE_ACCOUNT_KEY;
    const suffix = process.env.TABLES_STORAGE_ENDPOINT_SUFFIX;

    try {
        const url = 'https://' + account + '.table.' + suffix;

        const credential = new AzureNamedKeyCredential(account, accountKey);
        const serviceClient = new TableServiceClient(
            url,
            credential
        );
    
        const tableName = 'constructions';
        await serviceClient.createTable(tableName, {
            onResponse: (response) => {
                if (response.status === 409) {
                    context.log('Table constructions already exists');
                }
            }
        });
    
        const tableClient = new TableClient(url, tableName, credential);
        const rowKey = construction.toLowerCase();

        let entityResult = await tableClient.getEntity('prod', rowKey);
        if (!entityResult) {
            return false;
        }
        return Number(entityResult.AccessCode) === Number(accessCode);
    } catch (err) {
        context.log(err);
        return false;
    }
};

const insertCheckList = async ()

module.exports = async function (context, req) {
	try {

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

		let shouldSendMail = true;

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
		let secondMailAddress = '';
		let hasToRepair = false;
		let checklistEntity = {
			rowKey: new Date().toISOString()
		};

		let accessCode;
		for (let part of parts) {
			if (part && part.name) {
					switch (part.name) {
					case 'nameOfConstruction':
						nameOfConstruction = new Buffer(part.field, 'ascii').toString('utf8');
						checklistEntity.partitionKey = nameOfConstruction;
						msg.subject = msg.subject + ' ' + nameOfConstruction;
						break;
					case 'accessCode':
						accessCode = new Buffer(part.field, 'ascii').toString('utf8');
						let isValid = await checkAccessCodeValidity(context, nameOfConstruction, accessCode);
						if (!isValid) {
							context.res = {
								status: 401,
								headers: {
									'Content-Type': 'text/html; charset=utf-8'
								},
								body: 'Mauvais code d\'accès, <a href="." onclick="javascript:history.back();return false">veuillez reessayer</a>.'
							};
							return;
						}
						break;
					case 'date':
						date = part.field;
						break;
					case 'mailAddress':
						mailAddress = part.field;
						if (mailAddress.toLowerCase().indexOf('donotsend') >= 0) {
							shouldSendMail = false;
						}
						break;
					case 'secondMailAddress':
						secondMailAddress = part.field;
						break;
					}
			if (part.field === 'torepair') {
				hasToRepair = true;
			}
				}
		}

		if (isGlobalCode(accessCode)) {
			msg.subject = 'Cours ' + msg.subject;
		}

		// Send to ourselves just in case
		if (mailAddress && msg.to.filter(addr => addr === mailAddress).length === 0) {
			msg.cc = [mailAddress];
		}

		if (secondMailAddress && msg.to.filter(addr => addr === secondMailAddress).length === 0 &&
		(!msg.cc || msg.cc.filter(addr => addr === secondMailAddress).length === 0)) {
			if (!msg.cc) {
				msg.cc = [];
			}
			msg.cc.push(secondMailAddress);
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
				checklistEntity[part.name] = new Buffer(part.field, 'ascii').toString('utf8');
			} else if (fieldCodeToFieldName[part.name]) {
				let fieldText = part.field;
				if (fieldText === 'ok') {
				fieldText = 'Rien à signaler';
				} else if (fieldText === 'torepair') {
				fieldText = 'À réparer';
				}
				checklistEntity[part.name] = new Buffer(part.field, 'ascii').toString('utf8');

						const innerText = fieldCodeToFieldName[part.name] +
				': ' + fieldText;
						text += innerText + '\n';
						html += '<p>' + innerText + '</p>';
			} else if (part.name && part.name.indexOf('Photo') >= 0 && part.filename && part.data) {
				const nonPhotoName = part.name.substring(0, part.name.indexOf('Photo'));
				context.log('Got photo for ' + nonPhotoName);

				// TODO: store photo in blob storage

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

		if (shouldSendMail) {
			await sgMail.send(msg);
			context.log('e-mail sent');
		} else {
			context.log('Not sending the mail right now.');
		}

		
		context.res.status(200);
		if (shouldSendMail) {
			context.res.body = 'Checklist envoyée. N\'oubliez pas de scanner le code QR de sortie!';
		} else {
			context.res.body = 'Checklist seulement enregistrée.';
		}


		} else {
		context.res.status(500).send("No file(s) found.");
		}
	} catch (sendException) {
		context.log(sendException);
		context.res = {
			status: 500,
			body: "Erreur d'envoi: " + sendException
		};
	}
}
