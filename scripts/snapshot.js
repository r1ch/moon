const captureWebsite = require('capture-website');

(async () => {
  await captureWebsite.file(
    'https://bradi.sh/moon',
    'snapshot.png',
    {
      element : "#app",
      height: 9999
    }
  );
})();
