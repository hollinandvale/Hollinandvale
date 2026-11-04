(() => {
  'use strict';

  const form = document.querySelector('[data-product-enquiry]');
  const catalogue = window.HVCatalogue && window.HVCatalogue.models;
  const paths = { Marlow: 'marlow.html', Calder: 'calder.html', Alder: 'alder.html', Rowan: 'rowan.html' };
  const storageKey = 'hv.savedSelections.v1';
  const limit = 8;
  if (!form || !catalogue || form.querySelector('[data-selection-enhancements]')) return;
  const field = name => form.elements.namedItem(name);
  const currentModel = field('model') && field('model').value;
  const fieldset = form.querySelector('[data-product-fields]');
  if (!Object.hasOwn(paths, currentModel) || !Object.hasOwn(catalogue, currentModel) ||
      !field('size') || !field('fabric') || !field('colour') || (fieldset && fieldset.disabled)) return;

  const validSelection = value => {
    if (!value || typeof value !== 'object' || !Object.hasOwn(paths, value.model) ||
        !Object.hasOwn(catalogue, value.model)) return null;
    const range = catalogue[value.model];
    if (!Array.isArray(range.sizes) || !range.sizes.includes(value.size) ||
        !range.fabrics || !Object.hasOwn(range.fabrics, value.fabric)) return null;
    const fabric = range.fabrics[value.fabric];
    const index = range.sizes.indexOf(value.size);
    if (!Array.isArray(fabric.colours) || !fabric.colours.includes(value.colour) ||
        !Array.isArray(fabric.prices) || !Number.isFinite(fabric.prices[index])) return null;
    return { model: value.model, size: value.size, fabric: value.fabric, colour: value.colour };
  };
  const selectionKey = choice => JSON.stringify([choice.model, choice.size, choice.fabric, choice.colour]);
  const currentSelection = () => validSelection({
    model: currentModel, size: field('size').value, fabric: field('fabric').value, colour: field('colour').value
  });
  const priceFor = choice => {
    const range = catalogue[choice.model];
    return range.fabrics[choice.fabric].prices[range.sizes.indexOf(choice.size)];
  };
  const money = value => new Intl.NumberFormat('en-GB', {
    style: 'currency', currency: 'GBP', maximumFractionDigits: 0
  }).format(value);
  const linkFor = choice => {
    const link = new URL(paths[choice.model], window.location.href);
    link.search = '';
    link.hash = '';
    for (const name of ['model', 'size', 'fabric', 'colour']) link.searchParams.set(name, choice[name]);
    return link.href;
  };
  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  const action = (text, handler, label) => {
    const button = make('button', 'selection-action', text);
    button.type = 'button';
    if (label) button.setAttribute('aria-label', label);
    button.addEventListener('click', handler);
    return button;
  };

  const enhancement = make('div', 'selection-enhancements');
  enhancement.setAttribute('data-selection-enhancements', '');
  const toolbar = make('div', 'selection-toolbar');
  const note = make('p', 'selection-device-note', 'Save on this device, or share the exact size, fabric and colour.');
  const status = make('p', 'selection-status');
  status.setAttribute('role', 'status');
  const fallback = make('div', 'selection-share-fallback');
  fallback.hidden = true;
  const copyLabel = make('label', '', 'Selection link');
  copyLabel.htmlFor = 'hv-selection-share-link';
  const copyInput = make('input', 'selection-link-input');
  copyInput.id = 'hv-selection-share-link';
  copyInput.type = 'url';
  copyInput.readOnly = true;
  fallback.append(copyLabel, copyInput, make('p', '', 'Select and copy this link to share your choices.'));
  const savedPanel = make('details', 'saved-selections');
  const savedSummary = make('summary');
  const savedNote = make('p', 'selection-device-note', 'Saved in this browser only. Prices below are current listed prices, including eligible mainland delivery.');
  const savedList = make('ol', 'saved-selection-list');
  const emptyNote = make('p', 'selection-empty', 'No selections saved on this device yet.');
  let storage = null;
  let writable = true;
  let items = [];
  let initialNotice = '';

  let rawSaved = null;
  try {
    storage = window.localStorage;
    rawSaved = storage.getItem(storageKey);
  } catch (_) {
    writable = false;
    initialNotice = 'Saved selections are unavailable in this browser. You can still share a selection link.';
  }
  if (rawSaved) {
    try {
      if (rawSaved.length > 50000) throw new Error('Saved data exceeds limit');
      const saved = JSON.parse(rawSaved);
      if (!saved || saved.v !== 1 || !Array.isArray(saved.items)) throw new Error('Invalid saved format');
      const seen = new Set();
      for (const entry of saved.items) {
        const choice = validSelection(entry);
        if (!choice || seen.has(selectionKey(choice))) continue;
        seen.add(selectionKey(choice));
        items.push(choice);
        if (items.length === limit) break;
      }
    } catch (_) {
      initialNotice = 'Previous saved selections could not be read. Save a new selection to start again.';
    }
  }

  const persist = next => {
    if (!writable || !storage) {
      status.textContent = 'This browser cannot save selections. Share a link to keep your choices.';
      return false;
    }
    try {
      if (next.length) storage.setItem(storageKey, JSON.stringify({ v: 1, items: next }));
      else storage.removeItem(storageKey);
      items = next;
      return true;
    } catch (_) {
      writable = false;
      saveButton.disabled = true;
      status.textContent = 'Your selection could not be saved. This browser is blocking storage; share a link instead.';
      return false;
    }
  };

  const renderSaved = () => {
    savedSummary.textContent = 'Saved selections (' + items.length + ')';
    savedList.replaceChildren();
    emptyNote.hidden = items.length > 0;
    clearButton.hidden = items.length === 0;
    items.forEach((choice, index) => {
      const item = make('li', 'saved-selection');
      const link = make('a', 'saved-selection-link', choice.model + ' · ' + choice.size);
      link.href = linkFor(choice);
      link.setAttribute('aria-label', 'View saved ' + choice.model + ', ' + choice.size + ', ' + choice.fabric + ', ' + choice.colour);
      const detail = make('p', 'saved-selection-detail', choice.fabric + ' · ' + choice.colour);
      const price = make('p', 'saved-selection-price', money(priceFor(choice)));
      const controls = make('div', 'saved-selection-actions');
      if (choice.model === currentModel) controls.append(action('Update', () => {
        const replacement = currentSelection();
        if (!replacement) {
          status.textContent = 'Choose a size, upholstery and colour before updating a saved selection.';
          return;
        }
        if (selectionKey(replacement) === selectionKey(choice)) {
          status.textContent = 'This saved selection already has your current choices.';
          return;
        }
        const next = items.filter((entry, position) => position !== index && selectionKey(entry) !== selectionKey(replacement));
        next.splice(Math.min(index, next.length), 0, replacement);
        if (persist(next)) {
          renderSaved();
          status.textContent = 'Saved selection updated on this device.';
        }
      }, 'Update this saved ' + choice.model + ' with your current choices'));
      controls.append(action('Remove', () => {
        if (persist(items.filter((_, position) => position !== index))) {
          renderSaved();
          status.textContent = 'Selection removed from this device.';
        }
      }, 'Remove saved ' + choice.model + ', ' + choice.size + ', ' + choice.colour));
      item.append(link, detail, price, controls);
      savedList.append(item);
    });
  };

  const saveButton = action('Save selection', () => {
    const choice = currentSelection();
    if (!choice) {
      status.textContent = 'Choose a size, upholstery and colour before saving.';
      return;
    }
    if (items.some(entry => selectionKey(entry) === selectionKey(choice))) {
      savedPanel.open = true;
      status.textContent = 'This selection is already saved on this device.';
      return;
    }
    if (items.length >= limit) {
      savedPanel.open = true;
      status.textContent = 'You can save up to eight selections. Remove one before adding another.';
      return;
    }
    if (persist([...items, choice])) {
      renderSaved();
      savedPanel.open = true;
      status.textContent = 'Selection saved on this device.';
    }
  });
  saveButton.dataset.saveSelection = '';
  saveButton.disabled = !writable;

  const showCopyFallback = link => {
    copyInput.value = link;
    fallback.hidden = false;
    copyInput.focus();
    copyInput.select();
    status.textContent = 'Copy the link below to share your selection.';
  };
  const shareButton = action('Share selection', async () => {
    const choice = currentSelection();
    if (!choice) {
      status.textContent = 'Choose a size, upholstery and colour before sharing.';
      return;
    }
    const link = linkFor(choice);
    const browserNavigator = window.navigator || {};
    fallback.hidden = true;
    if (typeof browserNavigator.share === 'function') {
      try {
        await browserNavigator.share({
          title: choice.model + ' — Hollin & Vale',
          text: choice.size + ' · ' + choice.fabric + ' · ' + choice.colour,
          url: link
        });
        status.textContent = 'Selection handed to your chosen app.';
        return;
      } catch (error) {
        if (error && error.name === 'AbortError') {
          status.textContent = 'Sharing cancelled.';
          return;
        }
      }
    }
    if (browserNavigator.clipboard && typeof browserNavigator.clipboard.writeText === 'function') {
      try {
        await browserNavigator.clipboard.writeText(link);
        status.textContent = 'Selection link copied. Paste it into a message to share your choices.';
        return;
      } catch (_) { /* A visible manual-copy route remains available. */ }
    }
    showCopyFallback(link);
  });

  const clearButton = action('Clear saved selections', () => {
    if (persist([])) {
      renderSaved();
      status.textContent = 'Saved selections cleared from this device.';
    }
  });
  clearButton.className += ' selection-clear';
  toolbar.append(saveButton, shareButton);
  savedPanel.append(savedSummary, savedNote, emptyNote, savedList, clearButton);
  enhancement.append(toolbar, note, status, fallback, savedPanel);
  form.append(enhancement);
  renderSaved();

  const params = new URLSearchParams(window.location.search);
  if (['size', 'fabric', 'colour'].some(name => params.has(name))) {
    const restored = validSelection({
      model: params.get('model') || currentModel,
      size: params.get('size'), fabric: params.get('fabric'), colour: params.get('colour')
    });
    if (restored && restored.model === currentModel) {
      field('fabric').value = restored.fabric;
      field('fabric').dispatchEvent(new Event('change', { bubbles: true }));
      field('size').value = restored.size;
      field('size').dispatchEvent(new Event('change', { bubbles: true }));
      field('colour').value = restored.colour;
      field('colour').dispatchEvent(new Event('change', { bubbles: true }));
      initialNotice = 'Selection restored. The displayed price is the current retail price.' +
        (writable ? '' : ' Saved selections are blocked in this browser, but you can share links.');
    } else initialNotice = 'That shared selection is unavailable. Please choose a size, upholstery and colour.';
  }
  if (initialNotice) status.textContent = initialNotice;
})();
