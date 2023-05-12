var QRCode = require('qrcode');

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const url = process.env.BASE_URL + '/api/CheckInTrigger?construction=' +
    encodeURIComponent(req.query.construction);

    const qrCodeData = QRCode.toDataURL(url);

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: {
            url: url,
            qrCode: qrCodeData
        }
    };
}