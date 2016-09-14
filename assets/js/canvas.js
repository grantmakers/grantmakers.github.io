$(function() {
  'use strict';

  var canvas = document.querySelector('canvas'),
    context = canvas.getContext('2d'),
    color = '#c54e00',
    count = 250,
    flakes = [];

  canvas.width = window.innerWidth / 2;
  canvas.height = window.innerHeight;
  canvas.style.display = 'block';

  context.fillStyle = color;
  context.lineWidth = 0.1;
  context.strokeStyle = color;

  for (var i = 0; i < count; i++) {
    flakes.push(new Flake());
  }

  setInterval(animate, 1000 / 30);

  function animate () {
    context.clearRect(0, 0, canvas.width, canvas.height);

    for (var flake of flakes) {
      flake.draw();

      if (flake.y < 0 || flake.y > canvas.height) {
        flake.vx = flake.vx;
        flake.vy = -flake.vy;
      }
      else if (flake.x < 0 || flake.x > canvas.width) {
        flake.vx = -flake.vx;
        flake.vy = flake.vy;
      }
      flake.x += flake.vx;
      flake.y += flake.vy;
    }
  }

  function Flake () {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = -.5 + Math.random();
    this.vy = -.5 + Math.random();
    this.radius = Math.random();

    this.draw = function draw () {
      context.beginPath();
      context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
      context.fill();
    }
  }
});