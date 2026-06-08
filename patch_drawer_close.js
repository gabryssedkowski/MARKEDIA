const fs = require('fs');
let scriptJs = fs.readFileSync('script.js', 'utf8');

const target = `// Reset view when closing`;

const toInject = `// Reset view when closing
      const formContainer = drawer.querySelector('#cart-checkout-form-container');
      const checkoutBtnEl = drawer.querySelector('[data-cart-checkout]');
      if (formContainer) formContainer.style.display = 'none';
      if (checkoutBtnEl) checkoutBtnEl.style.display = 'flex';`;

if (scriptJs.includes(target)) {
    scriptJs = scriptJs.replace(target, toInject);
    fs.writeFileSync('script.js', scriptJs);
    console.log("Drawer close patched successfully.");
} else {
    console.log("Target not found.");
}
