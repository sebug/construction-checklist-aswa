const { TableServiceClient, AzureNamedKeyCredential, TableClient, TableQuery } = require("@azure/data-tables");

const checkAccessCodeValidity = async (context, construction, accessCode) => {
	if (Number(accessCode) === Number(process.env.GLOBAL_CODE) ||
        Number(accessCode) === Number(process.env.PERIODIC_CONTROL_CODE)) {
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

module.exports = async function (context, req) {
    context.log('Checking access code...');

    const construction = req.body && req.body.construction;
    const accessCode = req.body && req.body.accessCode;

    context.log(`Checking with construction ${construction} and access code ${accessCode}`);

    

    const responseMessage = {
        isValid: await checkAccessCodeValidity(context, construction, accessCode)
    };

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: responseMessage
    };
}