
(() => {
  document.querySelector('[data-print-checklist]')?.addEventListener('click', () => window.print());
  const button = document.querySelector('[data-menu-button]');
  const menu = document.querySelector('[data-mobile-menu]');
  if (button && menu) {
    const mobile = window.matchMedia('(max-width:900px)');
    const background = Array.from(document.querySelectorAll('main, .site-footer, .site-header .brand'));
    const initialInert = new Map(background.map(element => [element, element.inert]));
    const close = (restoreFocus = false) => {
      menu.classList.remove('open');
      document.body.classList.remove('menu-open');
      button.setAttribute('aria-expanded','false');
      button.setAttribute('aria-label','Open menu');
      menu.setAttribute('aria-hidden','true');
      menu.inert = true;
      background.forEach(element => { element.inert = initialInert.get(element); });
      if (restoreFocus && mobile.matches) button.focus();
    };
    button.addEventListener('click', () => {
      if (menu.classList.contains('open')) { close(true); return; }
      if (!mobile.matches) return;
      menu.classList.add('open');
      document.body.classList.add('menu-open');
      button.setAttribute('aria-expanded', 'true');
      button.setAttribute('aria-label', 'Close menu');
      menu.setAttribute('aria-hidden', 'false');
      menu.inert = false;
      background.forEach(element => { element.inert = true; });
      menu.querySelector('a')?.focus();
    });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => close()));
    window.addEventListener('keydown', event => {
      if (!menu.classList.contains('open')) return;
      if (event.key === 'Escape') { event.preventDefault(); close(true); return; }
      if (event.key !== 'Tab') return;
      const links = Array.from(menu.querySelectorAll('a[href]'));
      const first = links[0] || button;
      const last = links[links.length - 1] || button;
      const active = document.activeElement;
      if (event.shiftKey && active === button) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault(); button.focus();
      } else if (active !== button && !menu.contains(active)) {
        event.preventDefault(); (event.shiftKey ? last : first).focus();
      }
    });
    const resize = () => {
      if (mobile.matches) return;
      const focusWasInMenu = menu.contains(document.activeElement);
      close();
      if (focusWasInMenu) document.querySelector('.site-header .links a')?.focus();
    };
    mobile.addEventListener('change', resize);
    close();
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
      const materialOptions = product.querySelector('[data-material-options]');
      const selectedSwatch = product.querySelector('[data-selected-swatch]');
      const selectedSwatchImage = product.querySelector('[data-selected-swatch-image]');
      const selectedSwatchName = product.querySelector('[data-selected-swatch-name]');
      const selectedSwatchFabric = product.querySelector('[data-selected-swatch-fabric]');
      const fabricDescriptions = {
        'Lovely Velvet': 'Soft polyester velvet with an EasyClean finish.',
        'Manolo': 'Textured polyester chenille with a soft, tactile finish.',
        'Cambridge Linen': 'A blend of 43% cotton, 32% linen and 25% polyester.'
      };
      const materialDetails = {
        'Lovely Velvet': 'Polyester velvet',
        'Manolo': 'Polyester chenille',
        'Cambridge Linen': 'Cotton, linen & polyester blend'
      };
      const applySwatch = (element, fabricName, colourName) => {
        const choice = Object.hasOwn(range.fabrics, fabricName) ? range.fabrics[fabricName] : null;
        const atlas = choice && choice.swatches;
        if (!element || !atlas || !Number.isInteger(atlas.columns) || atlas.columns < 1 ||
            !Number.isInteger(atlas.rows) || atlas.rows < 1 || typeof atlas.image !== 'string' ||
            !/^assets\/swatch-[a-z0-9-]+\.webp$/.test(atlas.image)) return false;
        const names = Array.isArray(atlas.names) ? atlas.names : choice.colours;
        const index = names.indexOf(colourName);
        if (index < 0 || index >= atlas.columns * atlas.rows) return false;
        const column = index % atlas.columns;
        const row = Math.floor(index / atlas.columns);
        element.style.backgroundImage = 'url("' + atlas.image + '")';
        element.style.backgroundSize = (atlas.columns * 100) + '% ' + (atlas.rows * 100) + '%';
        element.style.backgroundPosition = (atlas.columns > 1 ? column / (atlas.columns - 1) * 100 : 0) + '% ' +
          (atlas.rows > 1 ? row / (atlas.rows - 1) * 100 : 0) + '%';
        return true;
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
        if (materialOptions) materialOptions.querySelectorAll('button').forEach(option => {
          option.setAttribute('aria-pressed', String(option.dataset.fabric === fabric.value));
        });
        if (selectedSwatch) {
          const visible = !!colour.value && applySwatch(selectedSwatchImage, fabric.value, colour.value);
          selectedSwatch.hidden = !visible;
          if (visible) {
            selectedSwatchImage.setAttribute('aria-label', fabric.value + ' fabric texture in ' + colour.value);
            selectedSwatchName.textContent = colour.value;
            selectedSwatchFabric.textContent = fabric.value + ' · ' + (materialDetails[fabric.value] || '');
          }
        }
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
          const image = document.createElement('span');
          image.className = 'swatch-face';
          image.setAttribute('aria-hidden', 'true');
          if (applySwatch(image, fabric.value, name)) {
            chip.className += ' swatch-choice';
            const label = document.createElement('span');
            label.className = 'swatch-label';
            label.textContent = name;
            chip.append(image, label);
          } else chip.textContent = name;
          chip.setAttribute('aria-label', 'Select ' + name);
          chip.setAttribute('aria-pressed', 'false');
          chip.addEventListener('click', () => { colour.value = name; update(); });
          options.append(chip);
        });
        colour.value = colours.includes(previous) ? previous : '';
        count.textContent = colours.length + ' colours available in this upholstery collection. Fabric availability is checked before payment.';
        description.textContent = fabricDescriptions[fabric.value] || '';
      };
      if (materialOptions) {
        materialOptions.replaceChildren();
        for (const [name, choice] of Object.entries(range.fabrics)) {
          const preferred = { 'Lovely Velvet': 'Moss', 'Manolo': 'Natural', 'Cambridge Linen': 'Linen' }[name];
          const example = choice.colours.includes(preferred) ? preferred : choice.colours[0];
          const card = document.createElement('button');
          card.type = 'button';
          card.className = 'material-choice';
          card.dataset.fabric = name;
          card.setAttribute('aria-pressed', 'false');
          const image = document.createElement('span');
          image.className = 'material-swatch';
          image.setAttribute('aria-hidden', 'true');
          const visual = applySwatch(image, name, example);
          if (visual) card.append(image);
          const title = document.createElement('strong');
          title.textContent = name === 'Cambridge Linen' ? 'Cambridge linen blend' : name;
          const detail = document.createElement('span');
          detail.className = 'material-detail';
          detail.textContent = materialDetails[name] || '';
          card.append(title, ' ', detail);
          if (visual) {
            const sample = document.createElement('small');
            sample.textContent = example + ' sample';
            card.append(' ', sample);
          }
          card.setAttribute('aria-label', ['Choose',title.textContent,detail.textContent,visual?example+' sample':''].filter(Boolean).join(' '));
          card.addEventListener('click', () => { fabric.value = name; updateColours(); update(); });
          materialOptions.append(card);
        }
      }
      size.addEventListener('change', update);
      fabric.addEventListener('change', () => { updateColours(); update(); });
      colour.addEventListener('change', update);
      updateColours();
      update();
      product.querySelector('[data-product-fields]').disabled = false;
    }
  }

})();
