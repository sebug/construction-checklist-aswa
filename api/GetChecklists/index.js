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
    context.log('Get checklists function triggered.');

    let accessCode = req.body && req.body.accessCode;
    if (!accessCode) {
        let cookieDict = parseCookies(req);
        accessCode = cookieDict.accessCode;
    }

    if (!accessCode || crypto.createHash('sha256').update(accessCode
        + process.env.LIST_ACCESS_CODE_SALT).digest('hex') !== process.env.LIST_ACCESS_CODE_HASH) {
        context.res = {
            status: 401,
            body: 'Code d\'accès invalide'
        };
        return;
    }

    try {
        let expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 365);

        const account = process.env.TABLES_STORAGE_ACCOUNT_NAME;
        const accountKey = process.env.TABLES_PRIMARY_STORAGE_ACCOUNT_KEY;
        const suffix = process.env.TABLES_STORAGE_ENDPOINT_SUFFIX;

        const url = 'https://' + account + '.table.' + suffix;

        const credential = new AzureNamedKeyCredential(account, accountKey);
        const serviceClient = new TableServiceClient(
            url,
            credential
        );

        const constructionsTableName = 'constructions';
        await serviceClient.createTable(constructionsTableName, {
            onResponse: (response) => {
                if (response.status === 409) {
                    context.log('Table constructions already exists');
                }
            }
        });

        const tableClient = new TableClient(url, constructionsTableName, credential);

        var constructionsIter = await tableClient.listEntities();

        let constructionsList = [];
        for await (const entity of constructionsIter) {
            constructionsList.push({
                name: entity.rowKey,
                accessCode: entity.AccessCode
            });
        }

        constructionsList = constructionsList.filter(dto => dto.name.indexOf('test') < 0);

        constructionsList.sort((a, b) => {
            const nameA = a.name.toUpperCase(); // ignore upper and lowercase
            const nameB = b.name.toUpperCase(); // ignore upper and lowercase
            if (nameA < nameB) {
                return -1;
            }
            if (nameA > nameB) {
                return 1;
            }
        
            // names must be equal
            return 0;
        });

        const checklistTableName = 'checklists';

        const checklistsTableClient = new TableClient(url, checklistTableName, credential);

        const checklistsIter = await checklistsTableClient.listEntities();

        let checklists = [];
        for await (const entity of checklistsIter) {
            checklists.push(entity);
        }

        checklists.sort((a, b) => {
            return new Date(b.timestamp) - new Date(a.timestamp);
        });

        const checkinsTableClient = new TableClient(url, 'checkins', credential);

        const checkinsIter = await checkinsTableClient.listEntities();

        let checkins = [];
        for await (const entity of checkinsIter) {
            checkins.push(entity);
        }

        let resultObject = {
            constructions: constructionsList,
            checklists: checklists,
            checkins: checkins
        };

        context.res = {
            // status: 200, /* Defaults to 200 */
            body: JSON.stringify(resultObject),
            headers: {
                'Set-Cookie': 'accessCode=' + accessCode + '; Expires=' + expiryDate.toUTCString() + ';',
                'Content-Type': 'application/json'
            }
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