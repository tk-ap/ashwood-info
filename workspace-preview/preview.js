const dialogs = [...document.querySelectorAll('dialog')];
const openDialog = (id) => document.getElementById(id)?.showModal();
document.querySelectorAll('[data-dialog]').forEach((button) => button.addEventListener('click', () => openDialog(button.dataset.dialog)));
document.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => button.closest('dialog')?.close()));
dialogs.forEach((dialog) => dialog.addEventListener('click', (event) => {
  const box = dialog.getBoundingClientRect();
  const outside = event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
  if (outside) dialog.close();
}));
