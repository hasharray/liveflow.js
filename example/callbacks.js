setTimeout(function beep() {
  console.log('beep');

  setTimeout(function boop() {
    console.log('sss');

    setTimeout(beep, 1000);
  }, 1000);
});
