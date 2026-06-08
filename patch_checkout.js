const fs = require('fs');

let scriptJs = fs.readFileSync('script.js', 'utf8');

const regex = /if \(checkoutBtn\) \{\s*checkoutBtn\.addEventListener\("click", \(\) => \{\s*if \(cartState\.items\.length === 0\) return;\s*let emailBody = "Dzień dobry, chciałbym złożyć zamówienie na następujące pakiety:\\n\\n";\s*cartState\.items\.forEach\(item => \{\s*emailBody \+= \`- \$\{item\.title\} \(x\$\{item\.quantity\}\) - \$\{item\.price \* item\.quantity\} zł\\n\`;\s*\}\);\s*emailBody \+= \`\\nŁączna wartość: \$\{cartTotal\.textContent\}\\n\\nProszę o kontakt w celu finalizacji\.\`;\s*window\.location\.href = \`mailto:markediapl@gmail\.com\?subject=Zamówienie z koszyka - Markedia&body=\$\{encodeURIComponent\(emailBody\)\}\`;\s*\}\);\s*\}/;

const newLogic = `  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      if (cartState.items.length === 0) return;

      // Look for the form in the currently active cart drawer
      const activeDrawer = checkoutBtn.closest('.cart-drawer');
      const formContainer = activeDrawer ? activeDrawer.querySelector("#cart-checkout-form-container") : document.getElementById("cart-checkout-form-container");

      if (formContainer) {
          formContainer.style.display = "block";
          checkoutBtn.style.display = "none";

          // Pre-fill if profile exists
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
  }

  // Handle forms for both index.html and zamow.html
  const checkoutForms = document.querySelectorAll("#cart-checkout-form");
  checkoutForms.forEach(checkoutForm => {
      checkoutForm.addEventListener("submit", (e) => {
          e.preventDefault();
          if (cartState.items.length === 0) return;

          const name = checkoutForm.querySelector('#checkout-name').value;
          const company = checkoutForm.querySelector('#checkout-company').value;
          const email = checkoutForm.querySelector('#checkout-email').value;
          const phone = checkoutForm.querySelector('#checkout-phone').value;
          const notes = checkoutForm.querySelector('#checkout-notes').value;

          const profile = { name, company, email, phone };
          localStorage.setItem('markedia-customer-profile', JSON.stringify(profile));

          const orderId = 'MRK-' + Math.random().toString(36).substr(2, 4).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
          const totalValue = cartState.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

          const order = {
              id: orderId,
              createdAt: new Date().toISOString(),
              status: 'nowe',
              statusRealizacji: 'nowe', // Future-proof CRM field
              total: totalValue,
              customerDetails: profile,
              notes: notes,
              adminNotes: '', // Future-proof
              clientMessages: [], // Future-proof
              projectFiles: [], // Future-proof
              eta: '14 dni roboczych', // Future-proof
              items: cartState.items
          };

          const existingOrders = JSON.parse(localStorage.getItem('markedia-orders') || '[]');
          existingOrders.unshift(order);
          localStorage.setItem('markedia-orders', JSON.stringify(existingOrders));

          cartState.items = [];
          saveCart();
          updateCartUI();

          if (typeof toggleCart === 'function') toggleCart();

          // Show confirmation modal
          const modal = document.getElementById('order-confirmation-modal');
          if (modal) {
              document.getElementById('confirm-order-id').innerText = orderId;
              document.getElementById('confirm-order-total').innerText = totalValue + ' zł';
              modal.style.display = 'flex';
          }
      });
  });`;

if (regex.test(scriptJs)) {
    scriptJs = scriptJs.replace(regex, newLogic);

    // Also remove the unused function
    scriptJs = scriptJs.replace(/function showCheckoutForm\(\) \{[\s\S]*?\}\n\n/, '');

    fs.writeFileSync('script.js', scriptJs);
    console.log("script.js patched successfully.");
} else {
    console.log("Could not find mailto logic using regex in script.js to replace!");
}
