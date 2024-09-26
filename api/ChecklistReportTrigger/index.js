const crypto = require('crypto');
const { TableServiceClient, AzureNamedKeyCredential, TableClient, TableQuery } = require("@azure/data-tables");
const { BlobServiceClient, 
    generateAccountSASQueryParameters, 
    AccountSASPermissions, 
    AccountSASServices,
    AccountSASResourceTypes,
    StorageSharedKeyCredential,
    SASProtocol } = require("@azure/storage-blob");

module.exports = async function (context, req) {
    context.log('Generating report.');

    let accessCode;
    let cookieDict = parseCookies(req);
    accessCode = cookieDict.accessCode;

    if (!accessCode || crypto.createHash('sha256').update(accessCode
        + process.env.LIST_ACCESS_CODE_SALT).digest('hex') !== process.env.LIST_ACCESS_CODE_HASH) {
        context.res = {
            status: 401,
            body: 'Code d\'accès invalide'
        };
        return;
    }

    try {
        const partitionKey = req.query.partitionKey;
        const rowKey = req.query.rowKey;

        const account = process.env.TABLES_STORAGE_ACCOUNT_NAME;
        const accountKey = process.env.TABLES_PRIMARY_STORAGE_ACCOUNT_KEY;
        const suffix = process.env.TABLES_STORAGE_ENDPOINT_SUFFIX;

        const url = 'https://' + account + '.table.' + suffix;

        const credential = new AzureNamedKeyCredential(account, accountKey);
        const serviceClient = new TableServiceClient(
            url,
            credential
        );

        const checklistTableName = 'checklists';

        const checklistsTableClient = new TableClient(url, checklistTableName, credential);

        let entity = await checklistsTableClient.getEntity(partitionKey, rowKey);

        const sectionsToConsider = [
            {
                key: 'access',
                title: 'Éclairage (Changement ampoules et Néons)'
            },
            {
                key: 'hygrometrie',
                title: 'Hygrométrie + Température'
            },
            {
                key: 'kitchen',
                title: 'Matériel électrique cuisine'
            },
            {
                key: 'water',
                title: 'Eau (robinet, WC, Douche, Lavabo)'
            },
            {
                key: 'access',
                title: 'Nettoyage des accès (Entrée, Saut de Loup)'
            },
            {
                key: 'floor',
                title: 'Remplir les grilles de sol'
            },
            {
                key: 'generator',
                title: 'Faire tourner le générateur aux. 1H ou Moteurs de la Ventilation 15minutes'
            },
            {
                key: 'controllist',
                title: 'Remplir la fiche contrôle'
            },
            {
                key: 'dehumidifier',
                title: 'Contrôler déshumidificateur'
            },
            {
                key: 'gifas',
                title: 'Lampes Gifas/Contrôler'
            },
            {
                key: 'enveloppe',
                title: 'Contrôler l\'enveloppe de l\'Abri'
            },
            {
                key: 'joints',
                title: 'Contrôler l\'état des joints de Portes'
            },
            {
                key: 'chaussette',
                title: 'Contrôler les Chaussettes'
            }
        ];

        const storageAccount = process.env.TABLES_STORAGE_ACCOUNT_NAME;
        const storageSuffix = process.env.TABLES_STORAGE_ENDPOINT_SUFFIX;

        const storageURL = 'https://' + storageAccount + '.blob.' + storageSuffix;

        const sasToken = process.env.IMAGE_STORAGE_SAS_TOKEN;
        const blobServiceClient = new BlobServiceClient(
                storageURL + '?' + sasToken,
                null
        );
        const containerName = 'construction-photos';
        const containerClient = await blobServiceClient.getContainerClient(containerName);

        const photoSuffixes = ['', '1', '2', '3', '4', '5', '6'];

        let expiry = new Date();
        expiry.setDate(expiry.getDate() + 1);
        for (const section of sectionsToConsider) {
            const keys = photoSuffixes.map(sf => section.key + 'Photo' + sf)
            .filter(k => entity[k]);

            for (const key of keys) {
                const blobFileName = entity[key];

                const blockBlobClient = containerClient.getBlockBlobClient(blobFileName);

                entity[key + 'Link'] = await blockBlobClient.generateSasUrl({
                    expiresOn: expiry
                });
            }
        }

        const responseObject = entity;
    
        context.res = {
            // status: 200, /* Defaults to 200 */
            body: JSON.stringify(responseObject)
        };
    } catch (e) {
        context.res = {
            status: 500,
            body: '' + e
        };
    }
}

function parseCookies (request) {
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}