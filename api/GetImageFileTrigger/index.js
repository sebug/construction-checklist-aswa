module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const blobFileName = req.query && req.query.blobFileName;

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: JSON.stringify({
            blobFileName: blobFileName
        })
    };
}