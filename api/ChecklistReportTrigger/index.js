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