var QRCode = require('qrcode');
const { TableServiceClient, AzureNamedKeyCredential, TableClient, TableQuery } = require("@azure/data-tables");

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const url = process.env.BASE_URL + '/api/CheckInTrigger?construction=' +
    encodeURIComponent(req.query.construction);

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
        if (entityResult && entityResult.ProofKey) {
            url += '&proofKey=' + encodeURIComponent(entityResult.ProofKey);
        }
    } catch (err) {
        context.error(err);
    }

    const opts = {
        type: 'image/png'
    };
    var dataUrlPromise = new Promise((resolve, reject) => {
        QRCode.toDataURL(url, opts, (err, url) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(url);
        });
    });
    const dataUrl = await dataUrlPromise;
    context.res = {
        status: 200,
        body: {
            url: url,
            dataUrl: dataUrl
        }
    };
}