const fs = require('fs');

const formHtml = `
        <div id="cart-checkout-form-container" style="display: none; margin-top: 16px; text-align: left;">
            <p style="font-size: 0.9rem; margin-bottom: 12px; color: var(--text-muted);">Dane Zamawiającego</p>
            <form id="cart-checkout-form" style="display: flex; flex-direction: column; gap: 12px;">
                <input type="text" id="checkout-name" name="name" placeholder="Imię i nazwisko" required style="padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); color: var(--text);">
                <input type="text" id="checkout-company" name="company" placeholder="Nazwa firmy (opcjonalnie)" style="padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); color: var(--text);">
                <input type="email" id="checkout-email" name="email" placeholder="Adres e-mail" required style="padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); color: var(--text);">
                <input type="tel" id="checkout-phone" name="phone" placeholder="Numer telefonu" required style="padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); color: var(--text);">
                <textarea id="checkout-notes" name="notes" placeholder="Dodatkowe uwagi do zamówienia" rows="3" style="padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); color: var(--text); resize: vertical;"></textarea>
                <button type="submit" class="btn btn--primary" style="width: 100%; margin-top: 8px;">
                    <i data-lucide="check"></i> Złóż zamówienie
                </button>
            </form>
        </div>
        <button class="btn btn--primary magnetic" type="button" data-cart-checkout id="cart-checkout-btn">
          <i data-lucide="credit-card" aria-hidden="true"></i>
          <span>Przejdź do kasy</span>
        </button>
`;

['index.html', 'zamow.html'].forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const target = `<button class="btn btn--primary magnetic" type="button" data-cart-checkout>
          <i data-lucide="credit-card" aria-hidden="true"></i>
          <span>Przejdź do kasy</span>
        </button>`;
    if(content.includes(target)) {
        content = content.replace(target, formHtml);
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    } else {
        console.log(`Target not found in ${file}`);
    }
});
