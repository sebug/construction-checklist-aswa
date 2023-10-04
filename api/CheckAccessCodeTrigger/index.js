module.exports = async function (context, req) {
    context.log('Checking access code...');

    const construction = req.body && req.body.construction;
    const accessCode = req.body && req.body.accessCode;

    context.log(`Checking with construction ${construction} and access code ${accessCode}`);

    const responseMessage = {
        isValid: Number(accessCode) === 123
    };

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: responseMessage
    };
}