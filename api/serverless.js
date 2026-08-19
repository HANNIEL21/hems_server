const { getExpressApp } = require("../dist/serverless");

module.exports = async function handler(req, res) {
  const app = await getExpressApp();
  return new Promise((resolve) => {
    res.on("finish", resolve);
    app.handle(req, res, () => {
      if (!res.headersSent) {
        res.status(404).send("Not found");
      }
      res.end();
    });
  });
};