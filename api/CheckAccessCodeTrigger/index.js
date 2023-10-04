const { TableServiceClient, AzureNamedKeyCredential, TableClient } = require("@azure/data-tables");

const checkAccessCodeValidity = async (context, construction, accessCode) => {
    const account = process.env.TABLES_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.TABLES_PRIMARY_STORAGE_ACCOUNT_KEY;
    const suffix = process.env.TABLES_STORAGE_ENDPOINT_SUFFIX;

    try {
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
        const rowKey = construction;
    
        let retrievePromise = new Promise((resolve, reject) => {
            tableClient.retrieveEntity(tableName, 'prod', construction.toLowerCase(), (error, result, response) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(result);
            });
        });
        let entityResult = await retrievePromise;
        if (!entityResult) {
            return false;
        }
        return entityResult;
    } catch (err) {
        context.log(err);
        return false;
    }
};

module.exports = async function (context, req) {
    context.log('Checking access code...');

    const construction = req.body && req.body.construction;
    const accessCode = req.body && req.body.accessCode;

    context.log(`Checking with construction ${construction} and access code ${accessCode}`);

    

    const responseMessage = {
        entity: await checkAccessCodeValidity(context, construction, accessCode)
    };

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: responseMessage
    };
}