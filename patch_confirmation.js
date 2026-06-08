const fs = require('fs');

const confirmHtml = `
    <!-- Order Confirmation Modal -->
    <div id="order-confirmation-modal" class="modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 1000; align-items: center; justify-content: center;">
        <div class="modal-content" style="background: var(--paper); padding: 40px; border-radius: 20px; max-width: 500px; width: 90%; text-align: center; border: 1px solid var(--border);">
            <i data-lucide="check-circle" style="width: 64px; height: 64px; color: var(--success); margin-bottom: 20px;"></i>
            <h2 style="margin-bottom: 10px;">Dziękujemy za zamówienie!</h2>
            <p style="color: var(--text-muted); margin-bottom: 24px;">Twoje zamówienie zostało pomyślnie złożone.</p>

            <div style="background: var(--surface); padding: 20px; border-radius: 12px; margin-bottom: 24px; text-align: left;">
                <p><strong>Nr zamówienia:</strong> <span id="confirm-order-id"></span></p>
                <p><strong>Wartość:</strong> <span id="confirm-order-total"></span></p>
                <p><strong>Przewidywany czas:</strong> 14 dni roboczych</p>
            </div>

            <a href="crm.html#client-orders-view" class="btn btn--primary" style="width: 100%; display: flex; justify-content: center;">
                Przejdź do "Moje zamówienia"
            </a>
            <button type="button" class="btn btn--dark" style="width: 100%; margin-top: 12px; display: flex; justify-content: center;" onclick="document.getElementById('order-confirmation-modal').style.display='none'">
                Zamknij
            </button>
        </div>
    </div>
    <!-- End Order Confirmation Modal -->
`;

['index.html', 'zamow.html'].forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const target = '</body>';
    if(content.includes(target) && !content.includes('order-confirmation-modal')) {
        content = content.replace(target, confirmHtml + '\n</body>');
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    } else {
        console.log(`Target not found in ${file}`);
    }
});
