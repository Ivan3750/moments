let mask = document.querySelector('.mask');

window.addEventListener('load', () => {
    setTimeout(() => {
    mask.classList.add('hide');
    mask.remove();
  }, 500);
})