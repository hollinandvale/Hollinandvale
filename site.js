
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

  const catalogue = window.HVCatalogue && window.HVCatalogue.models;
  const pounds = value => new Intl.NumberFormat('en-GB', {
    style: 'currency', currency: 'GBP', maximumFractionDigits: 0
  }).format(value);
  const getPrice = (model, size, fabric) => {
    const range = catalogue && Object.hasOwn(catalogue, model) ? catalogue[model] : null;
    const index = range && Array.isArray(range.sizes) ? range.sizes.indexOf(size) : -1;
    const choice = range && Object.hasOwn(range.fabrics, fabric) ? range.fabrics[fabric] : null;
    const value = index >= 0 && choice && Array.isArray(choice.prices) ? choice.prices[index] : null;
    return Number.isFinite(value) ? value : null;
  };
  const product = document.querySelector('[data-product-enquiry]');
  if (product && catalogue) {
    const model = product.elements.namedItem('model').value;
    const range = catalogue[model];
    if (range) {
      const size = product.elements.namedItem('size');
      const fabric = product.elements.namedItem('fabric');
      const colour = product.elements.namedItem('colour');
      const priceField = product.elements.namedItem('price');
      const priceOutput = document.querySelector('[data-retail-price]');
      const summary = document.querySelector('[data-retail-summary]');
      const options = product.querySelector('[data-colour-options]');
      const count = product.querySelector('[data-colour-count]');
      const description = product.querySelector('[data-fabric-description]');
      const fabricDescriptions = {
        'Lovely Velvet': 'Soft polyester velvet with an EasyClean finish.',
        'Manolo': 'Textured polyester chenille with a soft, tactile finish.',
        'Cambridge Linen': 'A blend of 43% cotton, 32% linen and 25% polyester.'
      };
      const update = () => {
        const value = getPrice(model, size.value, fabric.value);
        if (value === null) return;
        priceOutput.textContent = pounds(value);
        priceField.value = String(value);
        summary.textContent = size.value + ' · ' + fabric.value + (colour.value ? ' · ' + colour.value : '');
        options.querySelectorAll('button').forEach(option => {
          option.setAttribute('aria-pressed', String(option.dataset.colour === colour.value));
        });
      };
      const updateColours = () => {
        const colours = range.fabrics[fabric.value].colours;
        const previous = colour.value;
        colour.replaceChildren(new Option('Choose a colour', ''));
        options.replaceChildren();
        colours.forEach(name => {
          colour.add(new Option(name, name));
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'colour-name';
          chip.dataset.colour = name;
          chip.textContent = name;
          chip.setAttribute('aria-label', 'Select ' + name);
          chip.setAttribute('aria-pressed', 'false');
          chip.addEventListener('click', () => { colour.value = name; update(); });
          options.append(chip);
        });
        colour.value = colours.includes(previous) ? previous : '';
        count.textContent = colours.length + ' colours available in this upholstery collection. Fabric availability is checked before payment.';
        description.textContent = fabricDescriptions[fabric.value] || '';
      };
      size.addEventListener('change', update);
      fabric.addEventListener('change', () => { updateColours(); update(); });
      colour.addEventListener('change', update);
      updateColours();
      update();
      product.querySelector('[data-product-fields]').disabled = false;
    }
  }

  const form = document.querySelector('[data-contact-form]');
  if (form) {
    const params = new URLSearchParams(window.location.search);
    const models = Object.keys(catalogue || {});
    const model = params.get('model');
    for (const key of ['model', 'size', 'fabric', 'colour']) {
      const field = form.elements.namedItem(key);
      const value = params.get(key);
      if (field && value && (key !== 'model' || models.includes(value))) {
        field.value = value.slice(0, 120);
      }
    }
    if (params.get('enquiry') === 'trade') form.elements.namedItem('type').value = 'Trade enquiry';
    const updateContactPrice = () => {
      const price = form.elements.namedItem('price');
      if (!price) return;
      const value = getPrice(form.elements.namedItem('model').value,
        form.elements.namedItem('size').value, form.elements.namedItem('fabric').value);
      price.value = value === null ? '' : pounds(value);
    };
    for (const key of ['model', 'size', 'fabric']) {
      const field = form.elements.namedItem(key);
      if (field) field.addEventListener('input', updateContactPrice);
    }
    updateContactPrice();
    const message = form.elements.namedItem('message');
    if (model && models.includes(model) && message && !message.value) {
      message.value = (params.get('enquiry') === 'retail'
        ? 'I would like to request an order for the ' + model + '. Please confirm fabric availability and delivery to my address.'
        : 'I would like advice about the ' + model + '.') + '\n\n';
    }
    const status = document.createElement('p');
    status.className = 'form-status';
    status.setAttribute('role', 'status');
    form.append(status);
    form.addEventListener('submit', e => {
      e.preventDefault();
      updateContactPrice();
      const data = new FormData(form);
      const type = String(data.get('type') || 'General enquiry');
      const routes = {
        'General enquiry':'enquiries@hollinandvale.co.uk',
        'Trade enquiry':'trade@hollinandvale.co.uk',
        'Manufacturing / supplier':'partnerships@hollinandvale.co.uk'
      };
      const to = routes[type] || routes['General enquiry'];
      const chosenModel = String(data.get('model') || '');
      const subjectType = type === 'General enquiry' ? 'Retail order / advice' : type;
      const subject = encodeURIComponent('Hollin & Vale — ' + subjectType + (chosenModel ? ' — ' + chosenModel : ''));
      const body = encodeURIComponent(
        'Name: ' + (data.get('name') || '') + '\n' +
        'Email: ' + (data.get('email') || '') + '\n' +
        'Business: ' + (data.get('business') || '') + '\n\n' +
        'Model: ' + chosenModel + '\n' +
        'Size: ' + (data.get('size') || '') + '\n' +
        'Fabric: ' + (data.get('fabric') || '') + '\n' +
        'Colour: ' + (data.get('colour') || '') + '\n' +
        'Published retail price (eligible mainland delivery included): ' + (data.get('price') || 'Please help me choose a configuration') + '\n' +
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
