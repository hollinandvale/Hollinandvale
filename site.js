
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
      const subject = encodeURIComponent('Hollin & Vale — ' + type);
      const body = encodeURIComponent(
        'Name: ' + (data.get('name') || '') + '\n' +
        'Email: ' + (data.get('email') || '') + '\n' +
        'Business: ' + (data.get('business') || '') + '\n\n' +
        (data.get('message') || '')
      );
      window.location.href = 'mailto:' + to + '?subject=' + subject + '&body=' + body;
    });
  }
})();
