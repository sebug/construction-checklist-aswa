const crypto = require('crypto');

module.exports = async function (context, req) {
    context.log('Get checklists function triggered.');

    let accessCode = req.body && req.body.accessCode;
    if (!accessCode) {
        let cookieDict = parseCookies(req);
        accessCode = cookieDict.accessCode;
    }

    if (!accessCode || crypto.createHash('sha256').update(accessCode
        + process.env.LIST_ACCESS_CODE_SALT).digest('hex') !== process.env.LIST_ACCESS_CODE_HASH) {
        context.res = {
            status: 401,
            body: 'Code d\'accès invalide'
        };
        return;
    }

    let expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 365);

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: 'List goes here',
        headers: {
            'Set-Cookie': 'accessCode=' + accessCode + '; Expires=' + expiryDate.toUTCString() + ';'
        }
    };
}

function parseCookies (request) {
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}