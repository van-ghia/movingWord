function setup() {
    createCanvas(windowWidth, windowHeight);
    msg = new MSG("Chúc mừng sinh nhật ^^");

    // Fireworks initial setup
    fireworks.init();
}
  
function draw() {
    document.getElementById("speedCounter").innerHTML = document.getElementById("speed").value;
    // show intensity counter
    const intensityEl = document.getElementById('intensity');
    if (intensityEl) document.getElementById('intensityCounter').innerHTML = intensityEl.value;

    // Dark background to show fireworks clearly; use a slight alpha for soft trails
    background(10, 10, 20);

    // Draw moving message behind fireworks so fireworks appear on top
    drawMSG(msg);

    // Update and draw fireworks
    fireworks.update();
    fireworks.draw();
}

function drawMSG(msg) {
    msg.speed = document.getElementById("speed").value;
    msg.draw();
    msg.bounce();
    msg.move();
}

function MSG(msg) {
    this.size = windowWidth / 30;
    this.x = random(this.size, windowWidth);
    this.y = random(this.size, windowHeight);
    this.speed = 10;
    this.xvel = random([-1, 1]);
    this.yvel = random([-1, 1]);
    this.msg = msg;
    this.xscl = msg.length * this.size * 0.625;
    this.yscl = windowHeight / 10;
    
    this.draw = function() {
      // Ensure message is visible on dark background
      noStroke();
      fill(255);
      textSize(this.size);
      text(this.msg, this.x, this.y);
    };

    this.move = function() {
      this.x += this.xvel * this.speed;
      this.y += this.yvel * this.speed;
    };
    
    this.bounce = function() {
      let lower_bound = this.y + this.yscl > windowHeight && this.yvel > 0;
      let upper_bound = this.y < windowHeight / 10 && this.yvel < 0;
      let right_bound = this.x + this.xscl > windowWidth && this.xvel > 0;
      let left_bound = this.x < 0 && this.xvel < 0;
      if (lower_bound || upper_bound) {
        this.yvel *= -1;
      }
      if (right_bound || left_bound) {
        this.xvel *= -1
      }
    };
  }

// Fireworks manager (vanilla p5-based particles)
const fireworks = (function() {
  let particles = [];
  let shells = [];
  let running = false;
  let autoplay = false;
  let autoplayId = null;
  let prefersReducedMotion = false;
  const MAX_PARTICLES = 800; // increased for more/bigger fireworks
  const PALETTE = ['#ff4444', '#ffb86b', '#ffe37a', '#7affc8', '#66d0ff', '#b78bff', '#ff6fc1', '#ffffff'];

  function init() {
    prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Wire up toggle button
    const btn = document.getElementById('fireworks-toggle');
    if (btn) {
      btn.addEventListener('click', () => {
        toggle();
        btn.setAttribute('aria-pressed', String(running));
      });
      // Set initial aria state
      btn.setAttribute('aria-pressed', String(running));
    }

    // Launch on click if not reduced motion; ignore clicks on controls
    document.addEventListener('click', (e) => {
      if (prefersReducedMotion) return;
      if (!running) return;
      // Ignore clicks that happen inside UI controls
      if (e.target.closest && e.target.closest('#speedController, #fireworks-toggle')) return;
      launch(e.clientX);
    });

    // Pause when page hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopAutoplay();
      else if (autoplay) startAutoplay();
    });

    // Auto-start fireworks unless reduced-motion is preferred
    if (!prefersReducedMotion) start();

    // Adjust canvas on resize handled by p5 (no-op here)
  }

  function start() {
    if (prefersReducedMotion) return; // respect accessibility
    running = true;
    // Start autoplay by default when turned on
    autoplay = true;
    startAutoplay();
  }

  function stop() {
    running = false;
    stopAutoplay();
    shells = [];
    particles = [];
  }

  function toggle() {
    if (running) stop(); else start();
  }

  function startAutoplay() {
    if (!autoplay) return;
    stopAutoplay();
    const intensityEl = document.getElementById('intensity');
    const intensity = intensityEl ? Number(intensityEl.value) : 100;
    // frequency scales with intensity (higher intensity -> more frequent launches)
    const freq = Math.max(250, 1200 - intensity * 5);
    autoplayId = setInterval(() => {
      // Random launch position near top-middle or random
      const x = random(width * 0.15, width * 0.85);
      launch(x);
    }, freq);
  }

  function stopAutoplay() {
    if (autoplayId) {
      clearInterval(autoplayId);
      autoplayId = null;
    }
  }

  function launch(x) {
    // Create a shell that will explode shortly
    if (shells.length + particles.length > MAX_PARTICLES) return;
    const shell = {
      x: x,
      y: height + 10, // start off-screen bottom
      vx: (x - width/2) / random(110, 180), // vary lateral travel
      vy: random(-14, -9),
      color: random(PALETTE),
      life: random(45, 85),
      age: 0
    };
    shells.push(shell);
  }

  function explode(x, y, color) {
    const intensityEl = document.getElementById('intensity');
    const intensity = intensityEl ? Number(intensityEl.value) : 100;
    // Map intensity (10..200) to explosion size multiplier
    const mult = map(constrain(intensity, 10, 200), 10, 200, 0.6, 1.8);
    const baseCount = floor(random(40, 90)); // base
    const count = floor(baseCount * mult);
    for (let i = 0; i < count; i++) {
      if (shells.length + particles.length > MAX_PARTICLES) break;
      const angle = random(TWO_PI);
      const speed = random(1.5, 7) * mult; // scale speed with intensity
      particles.push({
        x: x,
        y: y,
        vx: cos(angle) * speed,
        vy: sin(angle) * speed,
        life: random(50 * mult, 160 * mult),
        age: 0,
        size: random(2 * mult, 6 * mult), // larger particles when intensity high
        color: color || random(PALETTE)
      });
    }
  }

  function update() {
    if (!running) return;

    // Update shells
    for (let i = shells.length - 1; i >= 0; i--) {
      const s = shells[i];
      s.vy += 0.25; // gravity (positive since vy is negative upward)
      s.x += s.vx;
      s.y += s.vy;
      s.age++;
      // explode when vy becomes positive (apex) or life reached
      if (s.vy > 0 || s.age > s.life) {
        explode(s.x, s.y, s.color);
        shells.splice(i, 1);
      }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += 0.05; // gravity
      p.vx *= 0.994; // air drag
      p.vy *= 0.994;
      p.x += p.vx;
      p.y += p.vy;
      p.age++;
      if (p.age > p.life) particles.splice(i, 1);
    }
  }

  function draw() {
    if (!running) return;
    // Use additive blending for bright fireworks
    blendMode(ADD);
    noStroke();

    // Draw shells as small glowing points
    for (let s of shells) {
      fill(s.color);
      ellipse(s.x, s.y, 5, 5);
    }

    // Draw particles
    for (let p of particles) {
      const alpha = map(p.age, 0, p.life, 1, 0);
      fill(colorFromHexWithAlpha(p.color, alpha));
      ellipse(p.x, p.y, p.size, p.size);
    }

    // restore normal blending for rest of drawing
    blendMode(BLEND);
  }

  function colorFromHexWithAlpha(hex, alpha) {
    // p5 color accepts hex and alpha separately, but we build an rgba string
    const c = hex.replace('#','');
    const r = parseInt(c.substring(0,2),16);
    const g = parseInt(c.substring(2,4),16);
    const b = parseInt(c.substring(4,6),16);
    return 'rgba('+r+','+g+','+b+','+alpha+')';
  }

  return {
    init,
    start,
    stop,
    toggle,
    update,
    draw
  };
})();
