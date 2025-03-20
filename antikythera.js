// antikythera.js
window.process = {
    env: {
      NODE_ENV: "production"
    }
  };
  
  window.addEventListener("DOMContentLoaded", async () => {
    const { Antikythera } = await import('@antikythera/antikythera');
  
    const api = new Antikythera({
      slug: "historyofnow" 
    });
  
    console.log("Antikythera initialized:", api);
  });