var QRCode = require('qrcode');

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const url = process.env.BASE_URL + '/api/CheckInTrigger?construction=' +
    encodeURIComponent(req.query.construction);

    const opts = {
        type: 'image/png'
    };
    var dataUrlPromise = new Promise((resolve, reject) => {
        QRCode.toDataURL(url, opts, (err, url) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(url);
        });
    });
    const dataUrl = await dataUrlPromise;
    context.res = {
        status: 200,
        body: {
            url: url,
            dataUrl: dataUrl
        }
    };
}