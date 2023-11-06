const crypto = require('crypto');

module.exports = async function (context, req) {
    context.log('Get checklists function triggered.');

    let accessCode = req.body && req.body.accessCode;
    // TODO: get from cookie as well

    if (!accessCode || crypto.createHash('sha256').update(accessCode
        + process.env.LIST_ACCESS_CODE_SALT).digest('hex') !== process.env.LIST_ACCESS_CODE_HASH) {
        context.res = {
            status: 401,
            body: 'Code d\'accès invalide'
        };
        return;
    }

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: 'List goes here'
    };
}