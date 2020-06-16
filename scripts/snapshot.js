const captureWebsite = require('capture-website');

(async () => {
  await captureWebsite.file(
    'https://bradi.sh/moon',
    'snapshot.png',
    {
      element : "body",
      height: 9999
    }
  );
})();
