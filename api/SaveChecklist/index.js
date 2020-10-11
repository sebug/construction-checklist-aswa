module.exports = async function (context, req) {
    context.log('Invoked function to save checklist.');

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: req.body
    };
}