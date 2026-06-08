const fs = require('fs');
let scriptJs = fs.readFileSync('script.js', 'utf8');

const target = `    // Handle forms for both index.html and zamow.html`;

const toInject = `
  const allCheckoutBtns = document.querySelectorAll("[data-cart-checkout]");
  allCheckoutBtns.forEach(btn => {
      btn.addEventListener("click", () => {
          if (cartState.items.length === 0) return;

          const activeDrawer = btn.closest('.cart-drawer');
          const formContainer = activeDrawer ? activeDrawer.querySelector("#cart-checkout-form-container") : document.getElementById("cart-checkout-form-container");

          if (formContainer) {
              formContainer.style.display = "block";
              btn.style.display = "none";

              const savedProfile = localStorage.getItem('markedia-customer-profile');
              if (savedProfile) {
                  try {
                      const profile = JSON.parse(savedProfile);
                      const nameInput = formContainer.querySelector('#checkout-name');
                      const companyInput = formContainer.querySelector('#checkout-company');
                      const emailInput = formContainer.querySelector('#checkout-email');
                      const phoneInput = formContainer.querySelector('#checkout-phone');

                      if (nameInput) nameInput.value = profile.name || '';
                      if (companyInput) companyInput.value = profile.company || '';
                      if (emailInput) emailInput.value = profile.email || '';
                      if (phoneInput) phoneInput.value = profile.phone || '';
                  } catch(e) {}
              }
          }
      });
  });

`;

if (scriptJs.includes(target)) {
    scriptJs = scriptJs.replace(target, toInject + target);
    fs.writeFileSync('script.js', scriptJs);
    console.log("Re-injected successfully.");
} else {
    console.log("Target not found.");
}
