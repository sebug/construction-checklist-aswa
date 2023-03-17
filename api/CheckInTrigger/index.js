module.exports = async function (context, req) {
    context.log('Checking in on shelter ' + req.query.shelter + ' at ' + new Date());

    context.res = {
        status: 302,
        headers: {
            "Location": "/?shelter=" + encodeURIComponent(req.query.shelter)
        },
        body: responseMessage
    };
}