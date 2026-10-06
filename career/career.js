(() => {
  const printButton = document.querySelector('[data-print-career]');
  printButton?.addEventListener('click', () => window.print());

  document.querySelectorAll('.evidence-card details').forEach((details) => {
    details.addEventListener('toggle', () => {
      if (!details.open) return;
      document.querySelectorAll('.evidence-card details[open]').forEach((other) => {
        if (other !== details) other.open = false;
      });
    });
  });
})();