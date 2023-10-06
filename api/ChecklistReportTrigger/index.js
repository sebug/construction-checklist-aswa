module.exports = async function (context, req) {
    context.log('Generating report.');

    const partitionKey = req.query.partitionKey;
    const rowKey = req.query.rowKey;

    const responseObject = {
        partitionKey,
        rowKey
    };

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: responseObject
    };
}