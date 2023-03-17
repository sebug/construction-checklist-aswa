module.exports = async function (context, req) {
    const d = new Date();
    context.log('Checking in on construction ' + req.query.construction + ' at ' + d.toISOString());

    try {
        context.bindings.tableBinding = [];

        context.bindings.tableBinding.push({
            "PartitionKey": "Prod",
            "RowKey": req.query.construction + "_" + d.toISOString(),
            "Date": d.toISOString(),
            "Construction": d.toISOString()
        });
    } catch (e) {
        context.log(e);
    }

    context.bindings.res = {
        status: 302,
        headers: {
            "Location": "/?construction=" + encodeURIComponent(req.query.construction)
        },
        body: null
    };
}