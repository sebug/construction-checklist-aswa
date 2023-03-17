module.exports = async function (context, req) {
    context.log('Checking in on construction ' + req.query.construction + ' at ' + new Date());

    context.res = {
        status: 307,
        headers: {
            "Location": "/?construction=" + encodeURIComponent(req.query.construction)
        },
        body: responseMessage
    };
}