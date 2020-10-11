const multipart = require('parse-multipart');

module.exports = async function (context, req) {
    context.log("Returns the result of the function.");

    const body = req.rawBody;
    // Retrieve the boundary id
    const boundary = multipart.getBoundary(req.headers["content-type"]);
    if (boundary) {
      const files = multipart.Parse(Buffer.from(body), boundary);
  
      if (files && files.length > 0) {
        // Do what you want to do with the file
      }
  
      context.res.status(200);
      context.res.body = 'Formulaire envoyé';

    } else {
      context.res.status(500).send("No file(s) found.");
    }
}