const captureWebsite = require('capture-website');

(async () => {
  await captureWebsite.file(
    'index.html',
    'local-file.png',
    {
      element : ".level0",
      height: 9999
    }
  );
})();
