var token = Math.random();

document.addEventListener('inject', function() {
  document.querySelector('span').innerHTML = token;
}, false);
