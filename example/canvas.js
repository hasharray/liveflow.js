var start = Date.now();

var canvas = document.createElement('canvas');
canvas.style.position = 'absolute';
canvas.style.top = '0';
canvas.style.left = '0';

addEventListener('resize', function () {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

document.body.appendChild(canvas);

var context = canvas.getContext('2d');
var balls = [];

balls.push({
  position: [canvas.width / 2, canvas.height / 2],
  velocity: [0, 0],
});

addEventListener('click', function (event) {
  balls.push({
    position: [event.clientX, event.clientY],
    velocity: [0, 0],
    radius: 25,
    elasticity: 0.5,
  });
});

setTimeout(function present(then) {
  var now = Date.now();
  var time = (now - then) / 1000;

  var gravity = [0, 9];

  context.fillStyle = '#333333';
  context.fillRect(0, 0, canvas.width, canvas.height);

  var seconds = (Date.now() - start) / 1000;
  context.fillStyle = '#ffffff';
  context.font = '16px Helvetica Neue';
  context.textAlign = 'center';

  context.fillText(seconds.toFixed(1) + ' seconds', canvas.width / 2, 32);
  for (var i = 0; i < balls.length; i++) {
    var ball = balls[i];

    ball.position[0] += ball.velocity[0] * time;
    ball.position[1] += ball.velocity[1] * time;

    ball.velocity[0] += gravity[0] * time;
    ball.velocity[1] += gravity[1] * time;

    if (ball.position[1] + ball.radius > canvas.height) {
      ball.position[1] = canvas.height - ball.radius;
      ball.velocity[1] *= -ball.elasticity;
    }

    context.beginPath();
    context.arc(ball.position[0], ball.position[1], ball.radius, 0, 2 * Math.PI, false);
    context.fillStyle = '#ffffff';
    context.fill();
    context.closePath();
  }

  setTimeout(present, 0, now);
}, 0, Date.now());
