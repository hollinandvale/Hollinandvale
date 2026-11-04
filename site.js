
(() => {
  const button = document.querySelector('[data-menu-button]');
  const menu = document.querySelector('[data-mobile-menu]');
  if (button && menu) {
    const close = () => {
      menu.classList.remove('open');
      document.body.classList.remove('menu-open');
      button.setAttribute('aria-expanded','false');
    };
    button.addEventListener('click', () => {
      const open = !menu.classList.contains('open');
      menu.classList.toggle('open', open);
      document.body.classList.toggle('menu-open', open);
      button.setAttribute('aria-expanded', String(open));
    });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
    window.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  const form = document.querySelector('[data-contact-form]');
  if (form) {
    const params = new URLSearchParams(window.location.search);
    const models = ['Merchant', 'Dockyard', 'Raffles', 'Foundry'];
    const model = params.get('model');
    for (const key of ['model', 'size', 'fabric']) {
      const field = form.elements.namedItem(key);
      const value = params.get(key);
      if (field && value && (key !== 'model' || models.includes(value))) {
        field.value = value.slice(0, 120);
      }
    }
    if (params.get('enquiry') === 'trade') form.elements.namedItem('type').value = 'Trade enquiry';
    const message = form.elements.namedItem('message');
    if (model && models.includes(model) && message && !message.value) {
      message.value = 'I would like advice and a quotation for the ' + model + '.\n\n';
    }
    const status = document.createElement('p');
    status.className = 'form-status';
    status.setAttribute('role', 'status');
    form.append(status);
    form.addEventListener('submit', e => {
      e.preventDefault();
      const data = new FormData(form);
      const type = String(data.get('type') || 'General enquiry');
      const routes = {
        'General enquiry':'enquiries@hollinandvale.co.uk',
        'Trade enquiry':'trade@hollinandvale.co.uk',
        'Manufacturing / supplier':'partnerships@hollinandvale.co.uk'
      };
      const to = routes[type] || routes['General enquiry'];
      const chosenModel = String(data.get('model') || '');
      const subject = encodeURIComponent('Hollin & Vale — ' + type + (chosenModel ? ' — ' + chosenModel : ''));
      const body = encodeURIComponent(
        'Name: ' + (data.get('name') || '') + '\n' +
        'Email: ' + (data.get('email') || '') + '\n' +
        'Business: ' + (data.get('business') || '') + '\n\n' +
        'Model: ' + chosenModel + '\n' +
        'Size: ' + (data.get('size') || '') + '\n' +
        'Fabric: ' + (data.get('fabric') || '') + '\n' +
        'Delivery postcode: ' + (data.get('postcode') || '') + '\n\n' +
        (data.get('message') || '')
      );
      status.textContent = 'Your enquiry is prepared for your email app. Review it and press Send there. If your email app does not open, use one of the direct email links on this page.';
      window.location.href = 'mailto:' + to + '?subject=' + subject + '&body=' + body;
    });
    const emailSubmit = form.querySelector('[data-email-submit]');
    if (emailSubmit) emailSubmit.disabled = false;
  }
})();
