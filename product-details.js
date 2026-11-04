/* Progressive product details. Measurements come from the published size table;
   configuration prices come from HVCatalogue. Photographs are never recoloured. */
(() => {
  'use strict';
  const form = document.querySelector('[data-product-enquiry]');
  if (!form || document.querySelector('[data-hv-product-details]')) return;
  const field = name => form.elements.namedItem(name);
  const model = field('model') && field('model').value;
  const range = window.HVCatalogue && window.HVCatalogue.models[model];
  if (!range || !field('size') || !field('fabric')) return;
  const text = node => node ? node.textContent.trim().replace(/\s+/g, ' ') : '';
  const node = (tag, className, content) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content !== undefined) element.textContent = content;
    return element;
  };
  const money = value => new Intl.NumberFormat('en-GB', {
    style: 'currency', currency: 'GBP', maximumFractionDigits: 0
  }).format(value);
  const sizeTable = Array.from(document.querySelectorAll('.spec-table')).find(table =>
    /dimensions/i.test(text(table.caption)) && table.tHead && table.tHead.rows[0].cells.length === 7);
  if (!sizeTable || !sizeTable.tBodies.length) return;
  const headings = Array.from(sizeTable.tHead.rows[0].cells).slice(1).map(text);
  const dimensions = new Map();
  Array.from(sizeTable.tBodies[0].rows).forEach(row => {
    const cells = Array.from(row.cells);
    const values = cells.slice(1).map(cell => Number(text(cell)));
    if (values.length === 6 && values.every(value => Number.isFinite(value) && value > 0)) {
      dimensions.set(text(cells[0]), values);
    }
  });
  const configuration = () => {
    const size = field('size').value;
    const fabric = field('fabric').value;
    const choice = Object.hasOwn(range.fabrics, fabric) ? range.fabrics[fabric] : null;
    const index = range.sizes.indexOf(size);
    const price = index >= 0 && choice && choice.prices[index];
    return {
      size, fabric,
      fabricLabel: text(Array.from(field('fabric').querySelectorAll('option')).find(option => option.value === fabric)) || fabric,
      colour: field('colour') ? field('colour').value : '',
      price: Number.isFinite(price) ? money(price) : 'Please enquire',
      measurements: dimensions.get(size)
    };
  };

  // Keep the original figures and captions. Only real images already on the page are used.
  const gallery = document.querySelector('.product-gallery');
  if (gallery && typeof HTMLDialogElement !== 'undefined' && HTMLDialogElement.prototype.showModal) {
    const photographs = Array.from(gallery.querySelectorAll('figure')).map(figure => ({
      figure, image: figure.querySelector('img'), caption: text(figure.querySelector('figcaption'))
    })).filter(item => item.image);
    if (photographs.length) {
      const dialog = node('dialog', 'hv-image-dialog');
      dialog.setAttribute('aria-labelledby', 'hv-image-title');
      dialog.setAttribute('aria-describedby', 'hv-image-caption');
      const header = node('div', 'hv-image-toolbar');
      const title = node('h2', '', model + ' images');
      title.id = 'hv-image-title';
      const close = node('button', 'hv-detail-button', 'Close');
      close.type = 'button';
      close.setAttribute('aria-label', 'Close enlarged image');
      header.append(title, close);
      const media = node('div', 'hv-image-media');
      media.tabIndex = 0;
      media.setAttribute('role', 'region');
      media.setAttribute('aria-label', 'Image; scroll to explore when zoomed');
      const image = node('img');
      media.append(image);
      const footer = node('div', 'hv-image-footer');
      const caption = node('p', 'hv-image-caption');
      caption.id = 'hv-image-caption';
      const controls = node('div', 'hv-image-controls');
      const previous = node('button', 'hv-detail-button', 'Previous');
      const next = node('button', 'hv-detail-button', 'Next');
      const zoom = node('button', 'hv-detail-button', 'Zoom in');
      [previous, next, zoom].forEach(button => { button.type = 'button'; });
      image.addEventListener('load', () => { zoom.disabled = false; });
      image.addEventListener('error', () => { zoom.disabled = true; });
      previous.setAttribute('aria-label', 'Previous image');
      next.setAttribute('aria-label', 'Next image');
      zoom.setAttribute('aria-pressed', 'false');
      const counter = node('span', 'hv-image-counter');
      counter.setAttribute('aria-live', 'polite');
      if (photographs.length > 1) controls.append(previous);
      controls.append(counter, zoom);
      if (photographs.length > 1) controls.append(next);
      footer.append(caption, controls);
      dialog.append(header, media, footer);
      document.body.append(dialog);
      let current = 0;
      let opener = null;
      const thumbnails = node('div', 'hv-gallery-thumbnails');
      thumbnails.setAttribute('role', 'group');
      thumbnails.setAttribute('aria-label', model + ' image choices');
      const galleryStatus = node('p', 'hv-gallery-status');
      galleryStatus.setAttribute('aria-live', 'polite');
      galleryStatus.setAttribute('aria-atomic', 'true');
      const selectPhotograph = index => {
        current = (index + photographs.length) % photographs.length;
        photographs.forEach((photograph, position) => {
          const active = position === current;
          photograph.figure.hidden = !active;
          photograph.thumbnail.setAttribute('aria-pressed', String(active));
        });
        const photograph = photographs[current];
        photograph.image.loading = 'eager';
        galleryStatus.textContent = 'Image ' + (current + 1) + ' of ' + photographs.length +
          (photographs.length > 1 ? '. Select a thumbnail to explore, or enlarge the image.' : '. Enlarge for a closer look.');
        return photograph;
      };
      const fit = () => {
        media.classList.remove('is-zoomed');
        image.style.width = '';
        zoom.textContent = 'Zoom in';
        zoom.setAttribute('aria-pressed', 'false');
        media.scrollTop = 0;
        media.scrollLeft = 0;
      };
      const show = index => {
        const photograph = selectPhotograph(index);
        fit();
        image.src = photograph.image.src;
        image.alt = photograph.image.alt;
        zoom.disabled = !(image.complete && image.naturalWidth > 0);
        caption.textContent = photograph.caption;
        counter.textContent = (current + 1) + ' of ' + photographs.length;
      };
      photographs.forEach((photograph, index) => {
        photograph.figure.id = photograph.figure.id || 'hv-gallery-photo-' + (index + 1);
        const trigger = node('button', 'hv-image-trigger');
        trigger.type = 'button';
        trigger.setAttribute('aria-haspopup', 'dialog');
        trigger.setAttribute('aria-label', 'Enlarge image ' + (index + 1) + ' of ' + model);
        photograph.image.before(trigger);
        trigger.append(photograph.image);
        trigger.append(node('span', 'hv-image-hint', 'Enlarge image'));
        photograph.trigger = trigger;
        trigger.addEventListener('click', () => {
          opener = trigger;
          show(index);
          dialog.showModal();
          close.focus();
        });
        const thumbnail = node('button', 'hv-gallery-thumb');
        thumbnail.type = 'button';
        thumbnail.setAttribute('aria-label', 'Show ' + model + ' image ' + (index + 1) + ' of ' + photographs.length + ': ' + photograph.image.alt);
        thumbnail.setAttribute('aria-controls', photograph.figure.id);
        thumbnail.setAttribute('aria-pressed', 'false');
        const preview = node('img');
        preview.src = photograph.image.src.replace(/\.webp(?:\?.*)?$/, '-thumb.webp');
        preview.alt = '';
        preview.setAttribute('aria-hidden', 'true');
        preview.loading = 'lazy';
        preview.decoding = 'async';
        preview.width = 96;
        preview.height = 72;
        const number = node('span', 'hv-gallery-thumb-number', String(index + 1));
        number.setAttribute('aria-hidden', 'true');
        thumbnail.append(preview, number);
        thumbnail.addEventListener('click', () => selectPhotograph(index));
        thumbnail.addEventListener('keydown', event => {
          let destination = index;
          if (event.key === 'ArrowRight') destination = index + 1;
          else if (event.key === 'ArrowLeft') destination = index - 1;
          else if (event.key === 'Home') destination = 0;
          else if (event.key === 'End') destination = photographs.length - 1;
          else return;
          event.preventDefault();
          const selected = selectPhotograph(destination);
          selected.thumbnail.focus();
          selected.thumbnail.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        });
        photograph.thumbnail = thumbnail;
        thumbnails.append(thumbnail);
      });
      if (photographs.length > 1) gallery.append(thumbnails);
      gallery.append(galleryStatus);
      gallery.classList.add('hv-gallery-enhanced');
      selectPhotograph(0);
      close.addEventListener('click', () => dialog.close());
      dialog.addEventListener('close', () => {
        fit();
        const selectedTrigger = photographs[current].trigger || opener;
        if (selectedTrigger && selectedTrigger.isConnected) selectedTrigger.focus();
      });
      dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
      previous.addEventListener('click', () => show(current - 1));
      next.addEventListener('click', () => show(current + 1));
      zoom.addEventListener('click', () => {
        if (media.classList.contains('is-zoomed')) { fit(); return; }
        const width = Math.max(image.naturalWidth, image.getBoundingClientRect().width * 1.75);
        media.classList.add('is-zoomed');
        image.style.width = Math.round(width) + 'px';
        zoom.textContent = 'Fit image';
        zoom.setAttribute('aria-pressed', 'true');
      });
      dialog.addEventListener('keydown', event => {
        if (photographs.length > 1 && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
          event.preventDefault();
          show(current + (event.key === 'ArrowRight' ? 1 : -1));
        }
      });
    }
  }

  const panel = node('section', 'hv-selected-spec');
  panel.dataset.hvProductDetails = '';
  panel.id = 'selected-dimensions';
  panel.setAttribute('aria-labelledby', 'hv-selected-spec-title');
  const heading = node('h3', '', 'Your selected dimensions');
  heading.id = 'hv-selected-spec-title';
  const selected = node('p', 'hv-selected-configuration');
  selected.setAttribute('aria-live', 'polite');
  const drawing = node('div', 'hv-dimension-drawing');
  drawing.tabIndex = 0;
  drawing.setAttribute('role', 'region');
  drawing.setAttribute('aria-label', 'Selected sofa dimension diagram; scroll horizontally on smaller screens');
  const measurements = node('dl', 'hv-dimension-values');
  const note = node('p', 'hv-spec-note', 'Schematic only, not to scale. All measurements are in centimetres. Handmade upholstery can vary slightly. Confirm the final dimensions and check room, doorway, stair and delivery access before ordering.');
  panel.append(heading, selected, drawing, measurements, note);
  sizeTable.closest('.table-scroll').before(panel);

  const svgNS = 'http://www.w3.org/2000/svg';
  const svgNode = (tag, attributes, content) => {
    const element = document.createElementNS(svgNS, tag);
    Object.entries(attributes || {}).forEach(([name, value]) => element.setAttribute(name, String(value)));
    if (content !== undefined) element.textContent = content;
    return element;
  };
  const diagram = config => {
    const [width, depth, height, seatWidth, seatHeight, seatDepth] = config.measurements;
    const svg = svgNode('svg', { viewBox: '0 0 760 260', role: 'img', 'aria-labelledby': 'hv-drawing-title hv-drawing-description' });
    svg.append(svgNode('title', { id: 'hv-drawing-title' }, model + ' ' + config.size + ' dimension schematic'));
    svg.append(svgNode('desc', { id: 'hv-drawing-description' }, headings.map((label, i) => label + ' ' + config.measurements[i] + ' centimetres').join('. ') + '. Schematic only, not to scale.'));
    const line = (x1, y1, x2, y2, className) => svg.append(svgNode('line', { x1, y1, x2, y2, class: className || 'hv-dimension-line' }));
    const label = (x, y, content, attributes) => svg.append(svgNode('text', { x, y, 'text-anchor': 'middle', ...attributes }, content));
    const horizontal = (x1, x2, y, content) => {
      line(x1, y, x2, y); line(x1, y - 5, x1, y + 5); line(x2, y - 5, x2, y + 5); label((x1 + x2) / 2, y + 22, content);
    };
    const vertical = (x, y1, y2, content) => {
      line(x, y1, x, y2); line(x - 5, y1, x + 5, y1); line(x - 5, y2, x + 5, y2);
      label(x + 18, (y1 + y2) / 2, content, { transform: 'rotate(-90 ' + (x + 18) + ' ' + ((y1 + y2) / 2) + ')' });
    };
    label(180, 24, 'Front');
    label(565, 24, 'Side');
    svg.append(svgNode('rect', { x: 50, y: 55, width: 260, height: 115, rx: 7, class: 'hv-sofa-outline' }));
    line(76, 83, 76, 151, 'hv-sofa-detail'); line(284, 83, 284, 151, 'hv-sofa-detail');
    line(76, 125, 284, 125, 'hv-sofa-detail'); line(76, 151, 284, 151, 'hv-sofa-detail');
    horizontal(76, 284, 86, 'Seat width ' + seatWidth);
    horizontal(50, 310, 200, 'Width ' + width);
    vertical(330, 55, 170, 'Height ' + height);
    svg.append(svgNode('path', { d: 'M475 55 H505 V125 H650 V170 H475 Z', class: 'hv-sofa-outline' }));
    line(505, 150, 650, 150, 'hv-sofa-detail');
    horizontal(505, 650, 90, 'Seat depth ' + seatDepth);
    horizontal(475, 650, 200, 'Depth ' + depth);
    vertical(675, 125, 170, 'Seat height ' + seatHeight);
    return svg;
  };
  const update = () => {
    const config = configuration();
    panel.hidden = !config.measurements;
    if (!config.measurements) return;
    selected.textContent = model + ' · ' + config.size;
    drawing.replaceChildren(diagram(config));
    measurements.replaceChildren();
    headings.forEach((label, index) => {
      const item = node('div');
      item.append(node('dt', '', label), node('dd', '', config.measurements[index] + ' cm'));
      measurements.append(item);
    });
  };
  const actions = node('div', 'hv-spec-actions');
  const jump = node('a', 'hv-detail-button', 'View selected dimensions');
  jump.href = '#selected-dimensions';
  const print = node('button', 'hv-detail-button hv-print-button', 'Print your specification');
  print.type = 'button';
  actions.append(jump, print);
  form.after(actions);

  const printSheet = node('article', 'hv-print-spec');
  printSheet.setAttribute('aria-label', 'Printable selected furniture specification');
  document.body.append(printSheet);
  const information = label => {
    const row = Array.from(document.querySelectorAll('.list .row')).find(item => text(item.querySelector('strong')) === label);
    return row ? text(row.querySelector('span')) : '';
  };
  const paragraphAfter = pattern => {
    const heading = Array.from(document.querySelectorAll('main h3')).find(item => pattern.test(text(item)));
    return heading && heading.nextElementSibling && heading.nextElementSibling.tagName === 'P' ? text(heading.nextElementSibling) : '';
  };
  const preparePrint = () => {
    const config = configuration();
    if (!config.measurements) return;
    printSheet.replaceChildren();
    printSheet.append(node('p', 'hv-print-brand', 'HOLLIN & VALE · FURNITURE'), node('h1', '', model + ' · ' + config.size));
    printSheet.append(node('p', 'hv-print-selection', config.fabricLabel + ' · ' + (config.colour || 'Colour to be chosen')));
    const materialDescription = text(form.querySelector('[data-fabric-description]'));
    if (materialDescription) printSheet.append(node('p', '', materialDescription));
    printSheet.append(node('p', 'hv-print-price', config.price), node('p', '', text(document.querySelector('.price-coverage'))));
    const timings = Array.from(document.querySelectorAll('.retail-assurances span')).map(text).join(' · ');
    if (timings) printSheet.append(node('p', '', timings));
    printSheet.append(node('h2', '', 'Dimensions in centimetres'));
    const table = node('table');
    const caption = node('caption', '', model + ' · ' + config.size + ' measurements');
    const body = node('tbody');
    headings.forEach((label, index) => {
      const row = node('tr');
      const key = node('th', '', label);
      key.scope = 'row';
      row.append(key, node('td', '', config.measurements[index] + ' cm'));
      body.append(row);
    });
    table.append(caption, body);
    printSheet.append(table, node('p', '', note.textContent));
    const details = [
      ['Frame and support', information('Frame and support')],
      ['Seats and backs', information('Seats and backs')],
      ['Cover', information('Cover')],
      ['Care', paragraphAfter(/^Care for your /)],
      ['Structural guarantee', paragraphAfter(/^Structural guarantee$/)]
    ];
    details.forEach(([label, content]) => {
      if (!content) return;
      const paragraph = node('p');
      paragraph.append(node('strong', '', label + ': '), document.createTextNode(content));
      printSheet.append(paragraph);
    });
    printSheet.append(node('p', 'hv-print-footnote', 'Published retail specification, not an accepted order or a guarantee of fit. Material availability, delivery postcode and access are confirmed before an order is accepted or payment requested.'));
    printSheet.append(node('p', 'hv-print-footnote', 'Prepared ' + new Intl.DateTimeFormat('en-GB', { dateStyle: 'long' }).format(new Date()) + ' · ' + window.location.href.split(/[?#]/)[0]));
  };
  print.addEventListener('click', () => { preparePrint(); window.print(); });
  window.addEventListener('beforeprint', () => { preparePrint(); document.body.classList.add('hv-printing'); });
  window.addEventListener('afterprint', () => document.body.classList.remove('hv-printing'));
  form.addEventListener('change', update);
  form.addEventListener('click', () => queueMicrotask(update));
  const summary = document.querySelector('[data-retail-summary]');
  if (summary) new MutationObserver(update).observe(summary, { childList: true, subtree: true, characterData: true });
  update();
})();
