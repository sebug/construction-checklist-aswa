const { TableServiceClient, AzureNamedKeyCredential, TableClient } = require("@azure/data-tables");

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
    
        const tableName = 'checkins';

        await serviceClient.createTable(tableName, {
            onResponse: (response) => {
                if (response.status === 409) {
                    context.log('Table checkins already exists');
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

        context.res = {
            status: 302,
            headers: {
                "Location": "/?construction=" + encodeURIComponent(req.query.construction)
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