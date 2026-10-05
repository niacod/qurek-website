// The app's cat (CatView.swift + CatPose.swift), redrawn for the web.
// Same 100×100 drawing units, same pose numbers, same idle life
// (breathe, blink, ear twitch, tail sway) and the same one-shot moves
// (wave, clap, jump, purr, celebrate). Keep in step with the Swift files.
(function () {
  "use strict";

  var COLORS = {
    grey:   { base: "#9AA0A6", shade: "#7F868D", feature: "#3A1020" },
    orange: { base: "#E08A3C", shade: "#C3722B", feature: "#3A1020" },
    white:  { base: "#F2EDE8", shade: "#DDD2C9", feature: "#3A1020" },
    black:  { base: "#3B3238", shade: "#544850", feature: "#F4EEF1" },
    calico: { base: "#F2EDE8", shade: "#DDD2C9", feature: "#3A1020", patch: "#E08A3C" },
    tabby:  { base: "#B08256", shade: "#946A42", feature: "#3A1020", stripes: true }
  };
  var SAKURA = "#FFB7C5";
  var SAKURA_DEEP = "#9E3D57";
  var STRIPE = "rgba(107, 74, 46, 0.55)";

  var DURATION = { wave: 1.4, clap: 1.2, jump: 0.9, purr: 1.6 };
  var CELEBRATE = 0.7, PETALS = 0.8, BLINK = 0.16, TWITCH = 0.38, PURR_HZ = 11;
  var EYE_FADE = 0.18;
  var OVERFLOW = 0.45;

  // MARK: Pose maths (CatPose.swift)

  function rest() {
    return {
      breathScaleX: 1, breathScaleY: 1, eyeOpenness: 1,
      leftEarAngle: 0, rightEarAngle: 0, tailAngle: 0, headTilt: 0,
      leftArmAngle: 0, rightArmAngle: 0, leftLegAngle: 0, rightLegAngle: 0,
      legLift: 0, hopOffset: 0, shiftX: 0, squashX: 1, squashY: 1,
      blushOpacity: 0.7, petalAge: null
    };
  }

  function compose(p, o) {
    p.breathScaleX *= o.breathScaleX; p.breathScaleY *= o.breathScaleY;
    p.eyeOpenness *= o.eyeOpenness;
    p.leftEarAngle += o.leftEarAngle; p.rightEarAngle += o.rightEarAngle;
    p.tailAngle += o.tailAngle; p.headTilt += o.headTilt;
    p.leftArmAngle += o.leftArmAngle; p.rightArmAngle += o.rightArmAngle;
    p.leftLegAngle += o.leftLegAngle; p.rightLegAngle += o.rightLegAngle;
    p.legLift += o.legLift; p.hopOffset += o.hopOffset; p.shiftX += o.shiftX;
    p.squashX *= o.squashX; p.squashY *= o.squashY;
    p.blushOpacity += o.blushOpacity - 0.7;
    if (p.petalAge === null) p.petalAge = o.petalAge;
    return p;
  }

  function keyframes(keys, f) {
    if (f <= keys[0][0]) return keys[0][1];
    var last = keys[keys.length - 1];
    if (f >= last[0]) return last[1];
    for (var i = 0; i < keys.length - 1; i++) {
      var a = keys[i], b = keys[i + 1];
      if (f <= b[0]) {
        var x = (f - a[0]) / (b[0] - a[0]);
        return a[1] + (b[1] - a[1]) * (x * x * (3 - 2 * x));
      }
    }
    return last[1];
  }

  // Seeded 0..<1 per (channel, slot), so each visit blinks on its own schedule.
  function unit(seed, channel, k) {
    var h = (seed ^ Math.imul(channel, 0x9E3779B1) ^ Math.imul(k + 1, 0x85EBCA77)) >>> 0;
    h = Math.imul(h ^ (h >>> 16), 0x7FEB352D);
    h = Math.imul(h ^ (h >>> 15), 0x846CA68B);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }

  function sway(t, period, low, high) {
    var s = Math.sin(2 * Math.PI * t / period);
    return s >= 0 ? s * high : -s * low;
  }

  function idle(t, mood, seed) {
    var p = rest();
    var sleepy = mood === "sleepy";
    var swell = (1 - Math.cos(2 * Math.PI * t / (sleepy ? 4.8 : 3.2))) / 2;
    p.breathScaleX = 1 + (sleepy ? 0.012 : 0.02) * swell;
    p.breathScaleY = 1 + (sleepy ? 0.022 : 0.035) * swell;

    if (mood === "neutral" && t >= 0.8) {
      var k = Math.floor((t - 0.8) / 4.5);
      var start = 0.8 + 4.5 * k + 1.7 * unit(seed, 1, k);
      if (t >= start && t <= start + BLINK) {
        p.eyeOpenness = keyframes([[0, 1], [0.5, 0.08], [1, 1]], (t - start) / BLINK);
      }
    }

    if (t >= 3) {
      var j = Math.floor((t - 3) / 9);
      var tStart = 3 + 9 * j + 3 * unit(seed, 2, j);
      if (t >= tStart && t <= tStart + TWITCH) {
        var isLeft = unit(seed, 3, j) < 0.5;
        var angle = (isLeft ? -1 : 1) *
          keyframes([[0, 0], [0.35, 9], [0.7, -3], [1, 0]], (t - tStart) / TWITCH);
        if (isLeft) p.leftEarAngle = angle; else p.rightEarAngle = angle;
      }
    }

    if (mood === "neutral") p.tailAngle = sway(t, 3.6, -5, 6);
    else if (mood === "happy") p.tailAngle = sway(t, 1.5, -11, 12);
    return p;
  }

  function celebrate(t) {
    var p = rest();
    if (t < 0 || t > PETALS) return p;
    p.petalAge = t;
    if (t > CELEBRATE) return p;
    var f = t / CELEBRATE;
    p.squashX = keyframes([[0, 1], [0.18, 1.08], [0.5, 0.94], [0.78, 1.03], [1, 1]], f);
    p.squashY = keyframes([[0, 1], [0.18, 0.90], [0.5, 1.08], [0.78, 0.97], [1, 1]], f);
    p.hopOffset = keyframes([[0, 0], [0.18, 0], [0.5, 0.09], [0.78, 0], [1, 0]], f);
    p.headTilt = keyframes([[0, 0], [0.45, -7], [1, 0]], f);
    p.blushOpacity = keyframes([[0, 0.7], [0.4, 1.0], [1, 0.7]], f);
    return p;
  }

  function gesture(g, t) {
    var p = rest();
    if (t < 0 || t > DURATION[g]) return p;
    var f = t / DURATION[g];
    if (g === "wave") {
      p.rightArmAngle = keyframes([[0, 0], [0.18, -150], [0.32, -125], [0.46, -160],
        [0.60, -125], [0.74, -150], [1, 0]], f);
      p.headTilt = keyframes([[0, 0], [0.3, 6], [0.7, 6], [1, 0]], f);
    } else if (g === "clap") {
      // A "yay" cheer: both arms thrown up and out, bouncing three times.
      var arm = keyframes([[0, 0], [0.15, 140], [0.30, 115], [0.45, 140], [0.60, 115],
        [0.75, 140], [0.90, 60], [1, 0]], f);
      p.leftArmAngle = arm; p.rightArmAngle = -arm;
      var b = keyframes([[0, 0], [0.15, 1], [0.30, 0], [0.45, 1], [0.60, 0], [0.75, 1], [1, 0]], f);
      p.squashX = 1 + 0.02 * b; p.squashY = 1 - 0.015 * b;
    } else if (g === "jump") {
      p.squashX = keyframes([[0, 1], [0.15, 1.12], [0.45, 0.92], [0.60, 0.96], [0.82, 1.08], [1, 1]], f);
      p.squashY = keyframes([[0, 1], [0.15, 0.84], [0.45, 1.12], [0.60, 1.06], [0.82, 0.90], [1, 1]], f);
      p.hopOffset = keyframes([[0, 0], [0.15, 0], [0.45, 0.24], [0.60, 0.20], [0.82, 0], [1, 0]], f);
      var arms = keyframes([[0, 0], [0.45, 70], [0.60, 70], [1, 0]], f);
      p.leftArmAngle = -arms; p.rightArmAngle = arms;
      var leg = keyframes([[0, 0], [0.15, -16], [0.45, 22], [0.60, 22], [0.82, -12], [1, 0]], f);
      p.leftLegAngle = leg; p.rightLegAngle = -leg;
      p.legLift = keyframes([[0, 0], [0.15, 0], [0.45, 0.03], [0.60, 0.03], [0.82, 0], [1, 0]], f);
      var ear = keyframes([[0, 0], [0.45, -14], [0.82, 6], [1, 0]], f);
      p.leftEarAngle = ear; p.rightEarAngle = -ear;
    } else if (g === "purr") {
      p.headTilt = keyframes([[0, 0], [0.25, -9], [0.62, 9], [1, 0]], f);
      var envelope = keyframes([[0, 0], [0.08, 1], [0.92, 1], [1, 0]], f);
      p.shiftX = 0.005 * envelope * Math.sin(2 * Math.PI * PURR_HZ * t);
    }
    return p;
  }

  // MARK: Drawing (CatView.swift, 100×100 units)

  function rotate(ctx, deg, px, py) {
    if (!deg) return;
    ctx.translate(px, py);
    ctx.rotate(deg * Math.PI / 180);
    ctx.translate(-px, -py);
  }

  function ellipse(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 2 * Math.PI);
  }

  function paw(ctx, cx, cy, w, h, c) {
    ellipse(ctx, cx - w / 2, cy - h / 2, w, h);
    ctx.fillStyle = c.shade; ctx.fill();
    ellipse(ctx, cx - w / 2 + 1, cy - h / 2 + 0.6, w - 2, h - 1.6);
    ctx.fillStyle = c.base; ctx.fill();
    ctx.beginPath();
    [-w * 0.15, w * 0.15].forEach(function (dx) {
      ctx.moveTo(cx + dx, cy + h / 2 - 0.9);
      ctx.lineTo(cx + dx, cy);
    });
    ctx.strokeStyle = c.shade; ctx.lineWidth = 1.1; ctx.lineCap = "round"; ctx.stroke();
  }

  function drawBody(ctx, pose, c, colorName) {
    // Tail first, behind everything, curling out from the right hip.
    ctx.save();
    rotate(ctx, pose.tailAngle, 74, 88);
    ctx.beginPath();
    ctx.moveTo(74, 88);
    ctx.bezierCurveTo(90, 90, 100, 76, 92, 62);
    ctx.strokeStyle = c.base; ctx.lineWidth = 9; ctx.lineCap = "round"; ctx.stroke();
    if (c.stripes) {
      ctx.beginPath();
      ctx.moveTo(89, 80); ctx.lineTo(96, 83);
      ctx.moveTo(93, 71); ctx.lineTo(99, 72);
      ctx.strokeStyle = STRIPE; ctx.lineWidth = 3; ctx.stroke();
    }
    ctx.restore();

    ellipse(ctx, 20, 56, 60, 44);
    ctx.fillStyle = c.base; ctx.fill();
    if (c.patch) {
      ctx.save(); ctx.globalAlpha *= 0.85;
      ellipse(ctx, 53, 63, 26, 22); ctx.fillStyle = c.patch; ctx.fill();
      ctx.restore();
    }
    if (colorName !== "white" && colorName !== "calico") {
      ellipse(ctx, 35, 74, 30, 22);
      ctx.fillStyle = "rgba(255, 248, 250, 0.28)"; ctx.fill();
    }

    // Hind legs: round haunch with a flat foot tucked in front.
    [[-1, pose.leftLegAngle], [1, pose.rightLegAngle]].forEach(function (l) {
      var s = l[0];
      ctx.save();
      ctx.translate(0, -pose.legLift * 100);
      rotate(ctx, l[1], 50 + s * 23, 88);
      ellipse(ctx, 50 + s * 23 - 9, 76, 18, 23);
      ctx.fillStyle = c.base; ctx.fill();
      ctx.beginPath();
      ctx.moveTo(50 + s * 16, 96);
      ctx.quadraticCurveTo(50 + s * 15, 80, 50 + s * 23, 77);
      ctx.strokeStyle = c.shade; ctx.lineWidth = 1.6; ctx.lineCap = "round"; ctx.stroke();
      paw(ctx, 50 + s * 22, 97, 14.5, 7.4, c);
      ctx.restore();
    });

    // Front legs: chubby tubes with round paws, turning about the shoulder.
    [[40, pose.leftArmAngle], [60, pose.rightArmAngle]].forEach(function (a) {
      var x = a[0], dx = x < 50 ? 1 : -1;
      ctx.save();
      rotate(ctx, a[1], x, 74);
      ctx.beginPath();
      ctx.moveTo(x, 74);
      ctx.lineTo(x + dx, 95);
      ctx.lineCap = "butt";
      ctx.strokeStyle = c.shade; ctx.lineWidth = 13; ctx.stroke();
      ctx.strokeStyle = c.base; ctx.lineWidth = 10.6; ctx.stroke();
      paw(ctx, x + dx, 96, 15.2, 8.8, c);
      ctx.restore();
    });
  }

  function drawFace(ctx, pose, eyes, c) {
    // Ears, bases sunk inside the head so they grow out of it.
    [[29, -1, pose.leftEarAngle], [71, 1, pose.rightEarAngle]].forEach(function (e) {
      var xo = e[0], s = e[1];
      function px(dx) { return xo + s * dx; }
      ctx.save();
      rotate(ctx, e[2], xo, 42);
      ctx.translate(xo, 44); ctx.scale(1.2, 1.2); ctx.translate(-xo, -44);

      ctx.beginPath();
      ctx.moveTo(px(12), 50);
      ctx.quadraticCurveTo(px(15), 24, px(9), 8);
      ctx.quadraticCurveTo(px(6), 2, px(1), 7);
      ctx.quadraticCurveTo(px(-7), 17, px(-16), 42);
      ctx.closePath();
      ctx.fillStyle = c.base; ctx.fill();

      ctx.beginPath();
      ctx.moveTo(px(8), 40);
      ctx.quadraticCurveTo(px(10), 24, px(7), 15);
      ctx.quadraticCurveTo(px(5), 10.5, px(1.5), 14);
      ctx.quadraticCurveTo(px(-3), 22, px(-8), 38);
      ctx.closePath();
      ctx.fillStyle = SAKURA; ctx.fill();
      ctx.restore();
    });

    ellipse(ctx, 3.85, 23.1, 92.3, 75.4);
    ctx.fillStyle = c.base; ctx.fill();

    ctx.save();
    if (c.patch || c.stripes) {
      ellipse(ctx, 3.85, 23.1, 92.3, 75.4);
      ctx.clip();
    }
    if (c.patch) {
      ellipse(ctx, 2.3, 21.5, 46.2, 46.2); ctx.fillStyle = c.patch; ctx.fill();
      ctx.save(); ctx.globalAlpha *= 0.85;
      ellipse(ctx, 60.8, 64.6, 33.8, 33.8); ctx.fill();
      ctx.restore();
    }
    if (c.stripes) {
      for (var i = 0; i < 3; i++) {
        var y = 34 + i * 7;
        ctx.beginPath();
        ctx.moveTo(34, y);
        ctx.quadraticCurveTo(50, y - 5, 66, y);
        ctx.strokeStyle = STRIPE; ctx.lineWidth = 3.5; ctx.lineCap = "butt"; ctx.stroke();
      }
    }

    // Blush, always on: part of the plush look.
    ctx.save();
    ctx.globalAlpha *= pose.blushOpacity;
    ctx.fillStyle = SAKURA;
    [19.2, 80.8].forEach(function (x) { ellipse(ctx, x - 13.1, 60, 26.2, 15.4); ctx.fill(); });
    ctx.restore();

    // Eyes; two sets only while a mood change cross-fades.
    var eyeY = 56.2;
    eyes.forEach(function (e) {
      var mood = e[0];
      ctx.save();
      ctx.globalAlpha *= e[1];
      [35, 65].forEach(function (x) {
        if (mood === "neutral") {
          var h = 11 * pose.eyeOpenness;
          ellipse(ctx, x - 5, eyeY - h / 2, 10, h);
          ctx.fillStyle = c.feature; ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(x - 11.9, eyeY);
          ctx.quadraticCurveTo(x, eyeY - (mood === "happy" ? 16 : -5), x + 11.9, eyeY);
          ctx.strokeStyle = c.feature; ctx.lineWidth = 5.4; ctx.lineCap = "round"; ctx.stroke();
        }
      });
      ctx.restore();
    });

    ctx.beginPath();
    ctx.moveTo(44.6, 70.8); ctx.lineTo(55.4, 70.8); ctx.lineTo(50, 76.9);
    ctx.closePath();
    ctx.fillStyle = SAKURA_DEEP; ctx.fill();
    ctx.restore();
  }

  function drawPetals(ctx, age) {
    [[10, 22, 0, SAKURA], [86, 14, 0.12, SAKURA_DEEP]].forEach(function (pt) {
      var f = (age - pt[2]) / PETALS;
      if (f <= 0 || f >= 1) return;
      var scale = keyframes([[0, 0.3], [0.3, 1], [1, 0.6]], f);
      ctx.save();
      ctx.globalAlpha *= keyframes([[0, 0], [0.3, 1], [1, 0]], f);
      ctx.translate(pt[0] + 3, pt[1] + keyframes([[0, 0], [0.3, -4], [1, -12]], f));
      ctx.scale(scale, scale);
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.bezierCurveTo(-1, -3, 1, -3, 3, 0);
      ctx.bezierCurveTo(1, 3, -1, 3, -3, 0);
      ctx.fillStyle = pt[3]; ctx.fill();
      ctx.restore();
    });
  }

  function draw(ctx, px, pose, eyes, colorName) {
    var c = COLORS[colorName];
    var u = px / (100 * (1 + 2 * OVERFLOW));
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, px, px);
    ctx.scale(u, u);
    ctx.translate(OVERFLOW * 100, OVERFLOW * 100);

    ctx.save();
    ctx.translate(50 + pose.shiftX * 100, 100 - pose.hopOffset * 100);
    ctx.scale(pose.breathScaleX * pose.squashX, pose.breathScaleY * pose.squashY);
    ctx.translate(-50, -100);
    drawBody(ctx, pose, c, colorName);
    rotate(ctx, pose.headTilt, 50, 56.3);
    ctx.translate(19, 0);
    ctx.scale(0.62, 0.62);
    drawFace(ctx, pose, eyes, c);
    ctx.restore();

    if (pose.petalAge !== null) drawPetals(ctx, pose.petalAge);
  }

  // MARK: The live cat

  function Cat(canvas, opts) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.color = opts.color || "calico";
    this.mood = "neutral";
    this.seed = (Math.random() * 4294967296) >>> 0;
    this.start = performance.now();
    this.celebrateStart = null;
    this.gesture = null;
    this.gestureStart = null;
    this.fadeFrom = null;
    this.fadeStart = -1e9;
    this.still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.resize();
    var self = this;
    window.addEventListener("resize", function () { self.resize(); });
    if (this.still) this.frame(performance.now());
    else requestAnimationFrame(function loop(now) { self.frame(now); requestAnimationFrame(loop); });
  }

  Cat.prototype.resize = function () {
    var css = this.canvas.getBoundingClientRect().width || 200;
    this.px = Math.round(css * (window.devicePixelRatio || 1));
    this.canvas.width = this.canvas.height = this.px;
    if (this.still) this.frame(performance.now());
  };

  Cat.prototype.setColor = function (name) {
    this.color = name;
    if (this.still) this.frame(performance.now());
  };

  Cat.prototype.setMood = function (mood) {
    if (mood === this.mood) return;
    this.fadeFrom = this.mood;
    this.fadeStart = performance.now();
    this.mood = mood;
    if (mood === "happy") this.celebrateStart = performance.now();
    if (this.still) this.frame(performance.now());
  };

  Cat.prototype.play = function (g) {
    if (this.still) return;
    this.gesture = g;
    this.gestureStart = performance.now();
  };

  Cat.prototype.frame = function (now) {
    var pose = rest(), eyes = [[this.mood, 1]];
    if (!this.still) {
      pose = idle((now - this.start) / 1000, this.mood, this.seed);
      if (this.celebrateStart !== null) {
        var ct = (now - this.celebrateStart) / 1000;
        if (ct > PETALS) this.celebrateStart = null;
        else pose = compose(pose, celebrate(ct));
      }
      if (this.gesture) {
        var gt = (now - this.gestureStart) / 1000;
        if (gt > DURATION[this.gesture]) this.gesture = null;
        else pose = compose(pose, gesture(this.gesture, gt));
      }
      var fade = (now - this.fadeStart) / 1000 / EYE_FADE;
      if (this.gesture === "purr") eyes = [["happy", 1]];
      else if (this.fadeFrom && this.fadeFrom !== this.mood && fade < 1) {
        eyes = [[this.fadeFrom, 1 - fade], [this.mood, fade]];
      }
    }
    draw(this.ctx, this.px, pose, eyes, this.color);
  };

  window.AcatCat = Cat;
  window.AcatCat.colors = Object.keys(COLORS);
})();
