// antikythera.js
window.process = {
  env: {
    NODE_ENV: "production",
  },
};

window.addEventListener("DOMContentLoaded", async () => {
  const { Antikythera } = await import(
    "./node_modules/@antikythera/antikythera/dist/antikythera.js"
  );

  const api = new Antikythera({
    slug: "historyofnow",
  });

  const u = api.getData(); // Assuming u is fetched from the API
  const A = [];
  if (Array.isArray(u)) {
    u.forEach((w) => {
      w.scanText.enableScanText &&
        w.scanText.scanSegments.forEach((N) => {
          A.push({
            id: w.id,
            keyword: N.scanKeyword,
            segment: N,
          });
        });
    });
  }

  console.log("Antikythera initialized:", api);
});
