// The app's cat (CatView.swift + CatPose.swift), redrawn for the web.
// Matches the 14-15 Nov 2026 cat tune-up: ink outline, pastel coats,
// bigger eyes and mouth, tapered S tail.
// Same 100×100 drawing units, same pose numbers, same idle life
// (breathe, blink, ear twitch, tail sway) and the same one-shot moves
// (wave, clap, jump, purr, celebrate). Keep in step with the Swift files.
(function () {
  "use strict";

  // Light-mode coats (CatColor.swift, cat tune-up 14 Nov 2026).
  var COLORS = {
    grey:   { base: "#B0A8B9", feature: "#46203A", blush: "#FF9CB9" },
    orange: { base: "#F5A764", feature: "#46203A", blush: "rgba(226, 113, 154, 0.75)" },
    white:  { base: "#FFFAF5", feature: "#46203A", blush: "#FF9CB9" },
    black:  { base: "#4B3B49", feature: "#FFF6F1", blush: "#FF9CB9", innerLine: "#8A7088" },
    calico: { base: "#FFFAF5", feature: "#46203A", blush: "#FF9CB9", patch: "#F5A764" },
    tabby:  { base: "#DCAA7E", feature: "#46203A", blush: "rgba(226, 113, 154, 0.75)", stripes: true }
  };
  var INK = "#46203A";
  var CAT_PINK = "#F7A6C1";
  var CAT_PINK_DEEP = "#E2719A";
  var WARM_BLUSH = "rgba(226, 113, 154, 0.75)";
  var STRIPE = "#B07650";
  var NOSE = "#E2719A";

  var DURATION = { wave: 1.4, clap: 1.2, jump: 0.9, purr: 1.6 };
  var CELEBRATE = 0.7, PETALS = 0.8, BLINK = 0.16, TWITCH = 0.38, PURR_HZ = 11;
  var EYE_SWAP = 0.24;
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
    else if (mood === "happy") p.tailAngle = sway(t, 1.5, -3, 8);
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
  // Cat tune-up (14-15 Nov 2026): every part is drawn twice, first in ink
  // grown by the outline, then in colour on top, so only the cat's outer
  // edge keeps a line.

  var FULL_HEAD = 0.62, EAR_SCALE = 1.2, INNER_RATIO = 0.85, ARM_WIDTH = 12;
  var FEATURE_GROW = 1.12, FACE_ANCHOR_Y = 82;
  var TAIL_PIVOT = [74, 88];
  var BODY_PATCH = [53, 63, 26, 22];
  var HEAD = { x: 3.85, y: 23.1, w: 92.3, h: 75.4 };

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

  function headPath(ctx) { ellipse(ctx, HEAD.x, HEAD.y, HEAD.w, HEAD.h); }

  // The outline in points (DESIGN.md §4.5), a little lighter on small cats.
  function outlinePoints(size) { return size >= 120 ? 2.2 : size >= 55 ? 1.8 : 1.5; }

  // The tail's centre line: up beside the body, then the tip flicks
  // outward in a long soft S. It tapers from 9 units to a round 4-unit tip.
  var TAIL = (function () {
    function cubic(p0, c1, c2, p1, t) {
      var u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
      return [a * p0[0] + b * c1[0] + c * c2[0] + d * p1[0], a * p0[1] + b * c1[1] + c * c2[1] + d * p1[1]];
    }
    var top = [92, 62], spine = [], i;
    for (i = 0; i <= 24; i++) spine.push(cubic(TAIL_PIVOT, [90, 90], [100, 76], top, i / 24));
    for (i = 1; i <= 14; i++) spine.push(cubic(top, [89.7, 57.9], [90.2, 51.5], [93, 48], i / 14));
    var n = spine.length;
    function tangent(i) {
      var a = spine[Math.max(0, i - 1)], b = spine[Math.min(n - 1, i + 1)];
      var len = Math.max(Math.hypot(b[0] - a[0], b[1] - a[1]), 0.0001);
      return [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
    }
    function half(i) { return 2 + 2.5 * (1 - i / (n - 1)); }
    var left = [], right = [], pts = [];
    for (i = 0; i < n; i++) {
      var t = tangent(i), h = half(i), p = spine[i];
      left.push([p[0] - t[1] * h, p[1] + t[0] * h]);
      right.push([p[0] + t[1] * h, p[1] - t[0] * h]);
    }
    pts = left.slice();
    var end = spine[n - 1], te = tangent(n - 1), r = half(n - 1);
    for (var k = 1; k < 12; k++) {
      var ang = Math.PI * k / 12;
      pts.push([end[0] + r * (-te[1] * Math.cos(ang) + te[0] * Math.sin(ang)),
                end[1] + r * (te[0] * Math.cos(ang) + te[1] * Math.sin(ang))]);
    }
    return pts.concat(right.reverse());
  })();

  function tailPath(ctx) {
    ctx.beginPath();
    ctx.moveTo(TAIL[0][0], TAIL[0][1]);
    for (var i = 1; i < TAIL.length; i++) ctx.lineTo(TAIL[i][0], TAIL[i][1]);
    ctx.closePath();
  }

  // In the ink pass, the shape filled and grown by `line` on every side;
  // in the colour pass, just filled.
  function silhouette(ctx, makePath, fill, pass, line) {
    makePath(ctx);
    if (pass === "ink") {
      ctx.fillStyle = INK; ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 2 * line; ctx.lineJoin = "round"; ctx.stroke();
    } else {
      ctx.fillStyle = fill; ctx.fill();
    }
  }

  function look(c, size) {
    var innerLine = c.innerLine || INK;
    return {
      innerInk: innerLine,
      crease: c.innerLine ? innerLine : "rgba(70, 32, 58, 0.55)",
      smallCat: size < 90,
      smallFace: size * FULL_HEAD < 44,
      whiskers: size * FULL_HEAD >= 56,
      facePoint: size / 100 * FULL_HEAD
    };
  }

  function paw(ctx, cx, cy, w, h, c, L, pass, line) {
    function oval(g) { ellipse(g, cx - w / 2, cy - h / 2, w, h); }
    if (pass === "ink") { silhouette(ctx, oval, INK, "ink", line); return; }
    oval(ctx);
    ctx.strokeStyle = L.innerInk; ctx.lineWidth = 2 * line * INNER_RATIO; ctx.stroke();
    ctx.fillStyle = c.base; ctx.fill();
    if (L.smallCat) return;
    ctx.beginPath();
    [-w * 0.15, w * 0.15].forEach(function (dx) {
      ctx.moveTo(cx + dx, cy + h / 2 - 0.9);
      ctx.lineTo(cx + dx, cy);
    });
    ctx.strokeStyle = L.crease; ctx.lineWidth = 1.5; ctx.lineCap = "round"; ctx.stroke();
  }

  function drawBody(ctx, pose, c, L, pass, line) {
    var inner = line * INNER_RATIO;

    // Tail first, behind everything, curling out from the right hip.
    ctx.save();
    rotate(ctx, pose.tailAngle, TAIL_PIVOT[0], TAIL_PIVOT[1]);
    silhouette(ctx, tailPath, c.base, pass, line);
    if (pass === "colour" && c.stripes) {
      tailPath(ctx); ctx.clip();
      ctx.beginPath();
      ctx.moveTo(89, 80); ctx.lineTo(99, 83);
      ctx.moveTo(92, 71); ctx.lineTo(101, 72);
      ctx.moveTo(88, 64); ctx.lineTo(97, 66);
      ctx.strokeStyle = STRIPE; ctx.lineWidth = 3.5; ctx.lineCap = "round"; ctx.stroke();
    }
    ctx.restore();

    silhouette(ctx, function (g) { ellipse(g, 20, 56, 60, 44); }, c.base, pass, line);
    if (pass === "colour" && c.patch) {
      ellipse(ctx, BODY_PATCH[0], BODY_PATCH[1], BODY_PATCH[2], BODY_PATCH[3]);
      ctx.fillStyle = c.patch; ctx.fill();
    }

    // Hind legs: round haunch with a flat foot tucked in front.
    [[-1, pose.leftLegAngle], [1, pose.rightLegAngle]].forEach(function (l) {
      var s = l[0];
      ctx.save();
      ctx.translate(0, -pose.legLift * 100);
      rotate(ctx, l[1], 50 + s * 23, 88);
      silhouette(ctx, function (g) { ellipse(g, 50 + s * 23 - 9, 76, 18, 23); }, c.base, pass, line);
      if (pass === "colour" && !L.smallCat) {
        ctx.beginPath();
        ctx.moveTo(50 + s * 16, 96);
        ctx.quadraticCurveTo(50 + s * 15, 80, 50 + s * 23, 77);
        ctx.strokeStyle = L.crease; ctx.lineWidth = 1.8; ctx.lineCap = "round"; ctx.stroke();
      }
      paw(ctx, 50 + s * 22, 97, 14.5, 7.4, c, L, pass, line);
      ctx.restore();
    });

    // Front legs: chubby tubes with round paws, turning about the shoulder.
    [[40, pose.leftArmAngle], [60, pose.rightArmAngle]].forEach(function (a) {
      var x = a[0], angle = a[1], out = x < 50 ? -1.5 : 1.5;
      ctx.save();
      rotate(ctx, angle, x, 74);
      function leg() { ctx.beginPath(); ctx.moveTo(x, 74); ctx.lineTo(x + out, 95); }
      if (pass === "ink") {
        leg();
        ctx.lineCap = "butt"; ctx.strokeStyle = INK; ctx.lineWidth = ARM_WIDTH + 2 * line; ctx.stroke();
      } else {
        // The rim starts below the shoulder, so the leg tapers out of the chest.
        ctx.beginPath();
        ctx.moveTo(x + (x < 50 ? -0.3 : 0.3), 82); ctx.lineTo(x + out, 95);
        ctx.lineCap = "round"; ctx.strokeStyle = Math.abs(angle) > 60 ? L.crease : L.innerInk;
        ctx.lineWidth = ARM_WIDTH + 2 * inner; ctx.stroke();
        leg();
        ctx.lineCap = "butt"; ctx.strokeStyle = c.base; ctx.lineWidth = ARM_WIDTH; ctx.stroke();
        // Calico: the body patch carries on down the leg like a sock.
        if (c.patch) {
          ctx.save();
          var dx = out, dy = 21, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
          var hw = (ARM_WIDTH + 0.8) / 2, nx = -uy * hw, ny = ux * hw;
          var x0 = x - ux * hw, y0 = 74 - uy * hw, x1 = x + out + ux * hw, y1 = 95 + uy * hw;
          ctx.beginPath();
          ctx.moveTo(x0 + nx, y0 + ny); ctx.lineTo(x1 + nx, y1 + ny);
          ctx.lineTo(x1 - nx, y1 - ny); ctx.lineTo(x0 - nx, y0 - ny);
          ctx.closePath(); ctx.clip();
          rotate(ctx, -angle, x, 74);
          ellipse(ctx, BODY_PATCH[0], BODY_PATCH[1], BODY_PATCH[2], BODY_PATCH[3]);
          ctx.fillStyle = c.patch; ctx.fill();
          ctx.restore();
        }
      }
      paw(ctx, x + out, 96, 15.2, 8.8, c, L, pass, line);
      ctx.restore();
    });
  }

  function drawFace(ctx, pose, eyes, c, L, pass, line) {
    // Chin line where the head sits over the body (lower arc only).
    if (pass === "colour") {
      ctx.beginPath();
      for (var i = 0; i <= 40; i++) {
        var a = (40 + i * 2.5) * Math.PI / 180;
        var px = HEAD.x + HEAD.w / 2 + HEAD.w / 2 * Math.cos(a);
        var py = HEAD.y + HEAD.h / 2 + HEAD.h / 2 * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = L.innerInk; ctx.lineWidth = 2 * line * INNER_RATIO; ctx.lineCap = "round"; ctx.stroke();
    }

    // Ears, bases sunk inside the head so they grow out of it.
    [[29, -1, pose.leftEarAngle], [71, 1, pose.rightEarAngle]].forEach(function (e) {
      var xo = e[0], s = e[1];
      function px(dx) { return xo + s * dx; }
      ctx.save();
      rotate(ctx, e[2], xo, 42);
      ctx.translate(xo, 44); ctx.scale(EAR_SCALE, EAR_SCALE); ctx.translate(-xo, -44);
      silhouette(ctx, function (g) {
        g.beginPath();
        g.moveTo(px(12), 50);
        g.quadraticCurveTo(px(15), 24, px(9), 8);
        g.quadraticCurveTo(px(6), 2, px(1), 7);
        g.quadraticCurveTo(px(-7), 17, px(-16), 42);
        g.closePath();
      }, c.base, pass, line / EAR_SCALE);
      if (pass === "colour") {
        ctx.beginPath();
        ctx.moveTo(px(8), 40);
        ctx.quadraticCurveTo(px(10), 24, px(7), 15);
        ctx.quadraticCurveTo(px(5), 10.5, px(1.5), 14);
        ctx.quadraticCurveTo(px(-3), 22, px(-8), 38);
        ctx.closePath();
        ctx.fillStyle = CAT_PINK; ctx.fill();
      }
      ctx.restore();
    });

    silhouette(ctx, headPath, c.base, pass, line);
    if (pass !== "colour") return;

    if (c.patch) {
      ctx.save(); headPath(ctx); ctx.clip();
      ctx.fillStyle = c.patch;
      ellipse(ctx, 2.3, 21.5, 46.2, 46.2); ctx.fill();
      if (!L.smallFace) { ellipse(ctx, 60.8, 64.6, 33.8, 33.8); ctx.fill(); }
      ctx.restore();
    }

    // Tabby: an "M" of three short marks on the forehead.
    if (c.stripes) {
      ctx.save(); headPath(ctx); ctx.clip();
      ctx.beginPath();
      if (!L.smallFace) { ctx.moveTo(50, 29); ctx.lineTo(50, 41); }
      [-1, 1].forEach(function (s) { ctx.moveTo(50 + s * 11, 31); ctx.lineTo(50 + s * 8, 39); });
      ctx.strokeStyle = STRIPE; ctx.lineWidth = L.smallFace ? 4 : 3; ctx.lineCap = "round"; ctx.stroke();
      ctx.restore();
    }

    // One shine, up on the left of the head (lavender on black).
    if (c !== COLORS.white && !L.smallFace) {
      ctx.save(); headPath(ctx); ctx.clip();
      rotate(ctx, -20, 26, 34);
      ellipse(ctx, 26 - 5.5, 34 - 2.75, 11, 5.5);
      ctx.fillStyle = c === COLORS.black ? "rgba(205, 189, 255, 0.5)" : "rgba(255, 255, 255, 0.55)";
      ctx.fill();
      ctx.restore();
    }

    // The whole face grows about a point near the chin, so it fills the head.
    ctx.save();
    ctx.translate(50, FACE_ANCHOR_Y); ctx.scale(FEATURE_GROW, FEATURE_GROW); ctx.translate(-50, -FACE_ANCHOR_Y);
    drawFeatures(ctx, pose, eyes, c, L, line);
    ctx.restore();
  }

  function drawFeatures(ctx, pose, eyes, c, L, line) {
    function faceLine(units, points) { return Math.max(units, points / Math.max(L.facePoint, 0.01)); }

    // Blush: always there, part of the plush look.
    ctx.save();
    ctx.globalAlpha *= pose.blushOpacity;
    [24.2, 75.8].forEach(function (x) {
      var onPatch = c.patch && x > 50 && !L.smallFace;
      ellipse(ctx, x - 7.75, 75.13 - 4.75, 15.5, 9.5);
      ctx.fillStyle = onPatch ? WARM_BLUSH : c.blush; ctx.fill();
    });
    ctx.restore();

    // Eyes: big, with a big and a small shine. Each set comes with how open
    // it is, for the blink that swaps one mood's eyes for the next.
    var eyeY = 64.82;
    eyes.forEach(function (e) {
      var mood = e[0], open = e[1];
      ctx.save();
      ctx.translate(0, eyeY * (1 - open));
      ctx.scale(1, open);
      [32.62, 67.38].forEach(function (x) {
        if (mood === "neutral") {
          var o = pose.eyeOpenness, h = 18 * o;
          ellipse(ctx, x - 7.5, eyeY - h / 2, 15, h);
          ctx.fillStyle = c.feature; ctx.fill();
          var shine = Math.min(1, Math.max(0, (o - 0.25) / 0.5));
          ctx.fillStyle = "rgba(255, 255, 255, " + shine + ")";
          ellipse(ctx, x + 2.2 - 2.6, eyeY - 3.4 * o - 2.6, 5.2, 5.2); ctx.fill();
          if (!L.smallFace) { ellipse(ctx, x - 2.6 - 1.1, eyeY + 3.8 * o - 1.1, 2.2, 2.2); ctx.fill(); }
        } else if (mood === "sleepy") {
          ctx.beginPath();
          ctx.moveTo(x - 9, eyeY);
          ctx.quadraticCurveTo(x, eyeY + 6.8, x + 9, eyeY);
          ctx.strokeStyle = c.feature; ctx.lineWidth = faceLine(4.6, 1.4); ctx.lineCap = "round"; ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(x - 8.9, eyeY + 1.8);
          ctx.quadraticCurveTo(x, eyeY - 7.2, x + 8.9, eyeY + 1.8);
          ctx.strokeStyle = c.feature; ctx.lineWidth = faceLine(6, 1.6); ctx.lineCap = "round"; ctx.stroke();
        }
      });
      ctx.restore();
    });

    // Nose, rounded corners.
    ctx.beginPath();
    ctx.moveTo(45.5, 71.36); ctx.lineTo(54.5, 71.36); ctx.lineTo(50, 76.2);
    ctx.closePath();
    ctx.fillStyle = NOSE; ctx.fill();
    ctx.strokeStyle = NOSE; ctx.lineWidth = 1.2; ctx.lineJoin = "round"; ctx.stroke();

    // Mouth: a small smile, 25% bigger than before (owner, 14 Nov).
    function m(x, y) { return [50 + (x - 50) * 1.25, 77.39 + (y - 77.39) * 1.25]; }
    function mv(p) { ctx.moveTo(p[0], p[1]); }
    function bz(c1, c2, p) { ctx.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], p[0], p[1]); }
    ctx.beginPath();
    mv(m(50, 77.39)); var mid = m(50, 79.65); ctx.lineTo(mid[0], mid[1]);
    bz(m(47.77, 83.42), m(42.56, 83.42), m(41.07, 80.4));
    mv(m(50, 79.65));
    bz(m(52.23, 83.42), m(57.44, 83.42), m(58.93, 80.4));
    ctx.strokeStyle = c.feature; ctx.lineWidth = faceLine(3.1, 1.1);
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();

    // Whiskers: 7 units, starting just outside the outline, at the unscaled
    // size. Small cats have none.
    if (!L.whiskers) return;
    ctx.save();
    ctx.translate(50, FACE_ANCHOR_Y); ctx.scale(1 / FEATURE_GROW, 1 / FEATURE_GROW); ctx.translate(-50, -FACE_ANCHOR_Y);
    ctx.beginPath();
    var midX = HEAD.x + HEAD.w / 2, midY = HEAD.y + HEAD.h / 2;
    [[68.34, -2], [72.86, 1]].forEach(function (w) {
      var y = w[0], dy = (y - midY) / (HEAD.h / 2);
      var start = HEAD.w / 2 * Math.sqrt(1 - dy * dy) + line + 1;
      [-1, 1].forEach(function (s) {
        ctx.moveTo(midX + s * start, y);
        ctx.lineTo(midX + s * (start + 7), y + w[1]);
      });
    });
    ctx.strokeStyle = "rgba(70, 32, 58, 0.7)"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.stroke();
    ctx.restore();
  }

  // Six petals rise around the head and fade (celebrate).
  function drawPetals(ctx, age) {
    [[10, 22, 0, CAT_PINK], [86, 14, 0.12, CAT_PINK_DEEP], [30, 4, 0.06, CAT_PINK_DEEP],
     [66, 2, 0.03, CAT_PINK], [2, 40, 0.09, CAT_PINK_DEEP], [92, 34, 0.05, CAT_PINK]].forEach(function (pt) {
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

  // `size` is the cat's own size in CSS px (the canvas minus its overflow).
  function draw(ctx, px, size, pose, eyes, colorName) {
    var c = COLORS[colorName];
    var L = look(c, size);
    var line = outlinePoints(size) * 100 / Math.max(size, 1);
    var u = px / (100 * (1 + 2 * OVERFLOW));
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, px, px);
    ctx.scale(u, u);
    ctx.translate(OVERFLOW * 100, OVERFLOW * 100);

    ["ink", "colour"].forEach(function (pass) {
      ctx.save();
      ctx.translate(50 + pose.shiftX * 100, 100 - pose.hopOffset * 100);
      ctx.scale(pose.breathScaleX * pose.squashX, pose.breathScaleY * pose.squashY);
      ctx.translate(-50, -100);
      drawBody(ctx, pose, c, L, pass, line);
      rotate(ctx, pose.headTilt, 50, 56.3);
      ctx.translate(19, 0);
      ctx.scale(FULL_HEAD, FULL_HEAD);
      drawFace(ctx, pose, eyes, c, L, pass, line / FULL_HEAD);
      ctx.restore();
    });

    if (pose.petalAge !== null) drawPetals(ctx, pose.petalAge);
  }

  // Sign-in's two cats touching heads (CatPose.nuzzling): the head leans
  // over and presses in every 2.6 s, ears easing out.
  var NUZZLE_PERIOD = 2.6;
  function nuzzling(t) {
    var press = keyframes([[0, 0], [0.12, 1], [0.32, 1], [0.48, 0], [1, 0]], (t % NUZZLE_PERIOD) / NUZZLE_PERIOD);
    var p = rest();
    p.headTilt = -12 - 4 * press;
    p.leftEarAngle = -6 * press;
    p.rightEarAngle = 6 * press;
    p.blushOpacity = 0.7 + 0.3 * press;
    return p;
  }

  // MARK: The live cat

  function Cat(canvas, opts) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.color = opts.color || "calico";
    this.mood = opts.mood || "neutral";
    this.nuzzle = !!opts.nuzzle;
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
    this.size = css / (1 + 2 * OVERFLOW);
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
      // Moods swap by a blink: the old eyes close, the new ones open.
      var fade = (now - this.fadeStart) / 1000 / EYE_SWAP;
      if (this.gesture === "purr") eyes = [["happy", 1]];
      else if (this.fadeFrom && this.fadeFrom !== this.mood && fade < 1) {
        eyes = fade < 0.5 ? [[this.fadeFrom, Math.max(0.1, 1 - fade * 2)]]
                          : [[this.mood, Math.max(0.1, fade * 2 - 1)]];
      }
    }
    if (this.nuzzle) pose = compose(pose, nuzzling(this.still ? 0 : (now - this.start) / 1000));
    draw(this.ctx, this.px, this.size, pose, eyes, this.color);
  };

  window.AcatCat = Cat;
  window.AcatCat.colors = Object.keys(COLORS);
})();
