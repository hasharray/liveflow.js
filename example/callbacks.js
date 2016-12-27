setTimeout(function beep() {
  console.log('beep');

  setTimeout(function boop() {
    console.log('boop');

    setTimeout(beep, 1000);
  }, 1000);
});
