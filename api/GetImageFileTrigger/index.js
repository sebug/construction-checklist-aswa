const { TableServiceClient, AzureNamedKeyCredential, TableClient, TableQuery } = require("@azure/data-tables");
const { BlobServiceClient, 
    generateAccountSASQueryParameters, 
    AccountSASPermissions, 
    AccountSASServices,
    AccountSASResourceTypes,
    StorageSharedKeyCredential,
    SASProtocol } = require("@azure/storage-blob");

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const blobFileName = req.query && req.query.blobFileName;

    try {
		const account = process.env.TABLES_STORAGE_ACCOUNT_NAME;
		const accountKey = process.env.TABLES_PRIMARY_STORAGE_ACCOUNT_KEY;
		const suffix = process.env.TABLES_STORAGE_ENDPOINT_SUFFIX;
	
		const url = 'https://' + account + '.blob.' + suffix;
	
		const sasToken = process.env.IMAGE_STORAGE_SAS_TOKEN;
		const blobServiceClient = new BlobServiceClient(
				url + '?' + sasToken,
				null
		);
		const containerName = 'construction-photos';
		const containerClient = await blobServiceClient.getContainerClient(containerName);
		const blobClient = containerClient.getBlobClient(blobFileName);

        const downloadBlockBlobResponse = await blobClient.download();
        const downloaded = await streamToBuffer(downloadBlockBlobResponse.readableStreamBody);


        context.res = {
            // status: 200, /* Defaults to 200 */
            body: JSON.stringify({
                blobFileName: blobFileName,
                downloaded: true
            })
        };
		
    } catch (e) {
        context.res = {
            status: 500,
            body: '' + e
        };
    }


}

async function streamToBuffer(readableStream) {
    return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => {
    chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on("end", () => {
    resolve(Buffer.concat(chunks));
    });
    readableStream.on("error", reject);
    });
}