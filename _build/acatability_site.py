"""Builds every page under acatability/ plus robots.txt, sitemap.xml and
llms.txt. Edit the words here, then run from the repo root:
    python3 _build/acatability_site.py
(GitHub Pages skips folders starting with "_", so this file is not published.)
Styles live in acatability/site.css, the cat in acatability/cat.js."""
import json, os, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://qurek.biz"
TODAY = "2026-10-18"
LAUNCH = "Sunday 1 November"

def esc(s): return html.escape(s, quote=True)

SAKURA_DEF = """<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><symbol id="sakura" viewBox="0 0 24 24"><g fill="currentColor">""" + "".join(
    f'<path transform="rotate({a} 12 12)" d="M12 12C9.4 10.2 8.5 6.6 10.2 3.9L12 5.3l1.8-1.4c1.7 2.7.8 6.3-1.8 8.1z"/>' for a in (0, 72, 144, 216, 288)
) + """</g><circle cx="12" cy="12" r="1.7" fill="#fff" opacity=".85"/></symbol></defs></svg>"""

def sakura(cls="sakura"): return f'<svg class="{cls}" aria-hidden="true"><use href="#sakura"/></svg>'

PAW = '<svg viewBox="0 0 24 24" fill="currentColor"><ellipse cx="12" cy="16" rx="5" ry="4"/><circle cx="6" cy="10" r="2"/><circle cx="10" cy="6.5" r="2"/><circle cx="14" cy="6.5" r="2"/><circle cx="18" cy="10" r="2"/></svg>'

ICON = {
    "journal": '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M9 9h6M9 13h4"/>',
    "heart": '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    "clock": '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
    "friends": '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 19c.6-3.4 3-5 6-5s5.4 1.6 6 5M15 14.5c2.6-.3 5 1 5.6 4"/>',
    "gift": '<rect x="4" y="9" width="16" height="11" rx="2"/><path d="M3 9h18M12 9v11M12 9c-2-4-6-4-6-1.5S10 9 12 9c2 0 6 1 6-1.5S14 5 12 9z"/>',
    "star": '<path d="M12 3l2.2 5 5.3.5-4 3.6 1.2 5.3L12 14.7 7.3 17.4l1.2-5.3-4-3.6 5.3-.5z"/>',
    "widget": '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="16" height="7" rx="2"/>',
    "bell": '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    "lock": '<rect x="5" y="10" width="14" height="10" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    "book": '<path d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1z"/><path d="M12 6v14"/>',
    "tag": '<path d="M4 12V5a1 1 0 0 1 1-1h7l8 8-8 8z"/><circle cx="8.5" cy="8.5" r="1.5"/>',
    "question": '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01"/>',
    "press": '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9h8M8 13h5"/>',
}

def icon(name, cls="icon"):
    return f'<div class="{cls}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICON[name]}</svg></div>'

ORG = {"@type": "Organization", "@id": f"{BASE}/#org", "name": "Qurek Limited", "url": f"{BASE}/",
       "email": "info@qurek.biz", "address": {"@type": "PostalAddress", "addressCountry": "GB"}}

APP_DESC = ("An iPhone app for small daily mental-health habits kept with friends. Each day you check in with a "
            "private journal, a few things you're grateful for and your journalling or meditation minutes. Friends in "
            "your pact see that you showed up, plus only what you choose to share. A cat cheers you on. Free on your "
            "own; one plan brings up to four friends in, and they join free.")

APP = {
    "@type": "MobileApplication", "@id": f"{BASE}/acatability/#app", "name": "Acatability",
    "description": APP_DESC, "operatingSystem": "iOS", "applicationCategory": "LifestyleApplication",
    "url": f"{BASE}/acatability/", "image": f"{BASE}/acatability/icon.png",
    "screenshot": [f"{BASE}/acatability/img/{n}.jpg" for n in ("check-in", "pact", "today", "history", "recap")],
    "author": {"@id": f"{BASE}/#org"}, "publisher": {"@id": f"{BASE}/#org"},
    "offers": [
        {"@type": "Offer", "name": "Solo", "price": "0", "priceCurrency": "GBP"},
        {"@type": "Offer", "name": "Pact, monthly", "price": "4.99", "priceCurrency": "GBP"},
        {"@type": "Offer", "name": "Pact, yearly", "price": "34.99", "priceCurrency": "GBP"},
        {"@type": "Offer", "name": "Founding Pact, one payment", "price": "40.00", "priceCurrency": "GBP", "priceValidUntil": "2026-12-31"},
    ],
}

NAV = [("/acatability/how-it-works/", "How it works"), ("/acatability/pricing/", "Pricing"),
       ("/acatability/faq/", "FAQ"), ("/acatability/guides/", "Guides")]

def crumbs_ld(trail):
    return {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": BASE + p} for i, (p, n) in enumerate(trail)]}

def page(path, title, desc, body, ld=(), current=None, og_type="website", scripts=""):
    url = BASE + path
    graph = {"@context": "https://schema.org", "@graph": [ORG, *ld]}
    nav = "\n".join(
        f'        <li><a href="{p}"{" aria-current=\"page\"" if p == current else ""}>{n}</a></li>' for p, n in NAV)
    return f"""<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(desc)}" />
  <link rel="canonical" href="{url}" />
  <meta name="theme-color" content="#FBF0EE" media="(prefers-color-scheme: light)" />
  <meta name="theme-color" content="#2B1E26" media="(prefers-color-scheme: dark)" />
  <meta property="og:site_name" content="Acatability" />
  <meta property="og:title" content="{esc(title)}" />
  <meta property="og:description" content="{esc(desc)}" />
  <meta property="og:url" content="{url}" />
  <meta property="og:type" content="{og_type}" />
  <meta property="og:image" content="{BASE}/acatability/img/og.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="icon" type="image/png" href="/acatability/icon.png" />
  <link rel="apple-touch-icon" href="/acatability/icon.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Gaegu:wght@700&family=Nunito:wght@600;700;800;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/acatability/site.css" />
  <script type="application/ld+json">
{json.dumps(graph, indent=2, ensure_ascii=False)}
  </script>
</head>
<body>
  {SAKURA_DEF}
  <div class="petals" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
  <header class="site-head">
    <div class="wrap">
      <a class="logo" href="/acatability/"><img src="/acatability/icon.png" width="36" height="36" alt="" /><picture><source srcset="/acatability/img/wordmark-dark.png" media="(prefers-color-scheme: dark)" /><img class="logo-word" src="/acatability/img/wordmark-light.png" width="708" height="138" alt="Acatability" /></picture></a>
      <ul class="nav">
{nav}
      </ul>
    </div>
  </header>

  <main>
    <div class="blobs" aria-hidden="true"><span></span><span></span><span></span></div>
{body}
  </main>

  <footer class="site-foot">
    <div class="wrap">
      <div class="paws" aria-hidden="true">{PAW}{PAW}{PAW}</div>
      <nav aria-label="Footer">
        <a href="/acatability/">Home</a>
        <a href="/acatability/how-it-works/">How it works</a>
        <a href="/acatability/pricing/">Pricing</a>
        <a href="/acatability/faq/">FAQ</a>
        <a href="/acatability/guides/">Guides</a>
        <a href="/acatability/press/">Press kit</a>
        <a href="https://niacod.github.io/acatability-legal/privacy">Privacy</a>
        <a href="https://niacod.github.io/acatability-legal/terms">Terms</a>
        <a href="mailto:info@qurek.biz">Contact</a>
      </nav>
      <p>Acatability is made by <a href="/">Qurek Limited</a>, a company registered in England and Wales.</p>
    </div>
  </footer>
{scripts}</body>
</html>
"""

def write(rel, text):
    full = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w") as f: f.write(text)

def phone(name, alt, eager=False):
    lazy = "" if eager else ' loading="lazy"'
    return f'<img class="phone" src="/acatability/img/{name}.jpg" width="600" height="1300" alt="{esc(alt)}"{lazy} />'

def heading(text, sub=None, eyebrow=None, ribbon=False, hid=None):
    idattr = f' id="{hid}"' if hid else ""
    eb = f'<p class="eyebrow">{eyebrow}</p>' if eyebrow else ""
    if ribbon:
        h = f'<h2{idattr} class="ribbon-wrap"><span class="ribbon">{sakura()}{text}{sakura()}</span></h2>'
    else:
        h = f'<h2{idattr}>{text}</h2>'
    s = f'<p class="lede">{sub}</p>' if sub else ""
    return f'<div class="section-head center">{eb}{h}{s}</div>'

def page_title(icon_name, text):
    return (f'<div class="page-title">{icon(icon_name, "tile")}<h1>{text}</h1>'
            f'<span class="sprinkle">{sakura()}{sakura()}</span></div>')

# ---------------------------------------------------------------- FAQ data
FAQS = [
    ("What is Acatability?", "An iPhone app for small daily mental-health habits you keep with friends. You check in each day with a private journal, a few good things and your minutes. Friends see you showed up. A cat cheers you on."),
    ("Is Acatability free?", "Yes, on your own, for good. Check-ins, your whole history, recaps and your cat are free. A pact with friends is £4.99 a month or £34.99 a year, with a 14-day free trial."),
    ("How many friends can join my pact?", "Up to 4, so 5 of you in total. Friends join with a 6-character invite code."),
    ("Do my friends have to pay?", "No. One person pays. Everyone they invite joins free."),
    ("Can my friends read my journal?", "No. Your journal is never shown to anyone. Friends see that you checked in, plus only what you choose to share, like your gratitude or minutes."),
    ("What do I do each day?", "Check in: write a line or two, list a few things you're grateful for, and tap how many minutes you journalled or meditated. It takes about 5 minutes."),
    ("What if I miss a day?", "Nothing bad happens. Your total days stay, and your cat never tells you off. Just check in the next day."),
    ("Does it send notifications?", "Only if you say yes. Then your cat says hi once a day, only on days you haven't checked in. You can also hear when a friend checks in: just their name."),
    ("Is Acatability therapy or a medical app?", "No. It's a daily habit app, not a treatment. If you're struggling, please talk to a doctor. In the UK and Ireland you can call Samaritans free on 116 123."),
    ("Is it on Android?", "Not yet. Acatability is made for iPhone."),
    ("When does Acatability launch?", f"{LAUNCH} 2026, on the App Store. Join the waitlist and we'll email you the link."),
    ("Where is my data kept?", "On servers in London. No ads, no tracking, no analytics. You can delete your account any time in the app."),
    ("Who makes Acatability?", "Qurek Limited, a small company in England and Wales. Say hi at info@qurek.biz."),
]

def faq_html(items):
    return "\n".join(f"""          <details>
            <summary>{esc(q)}</summary>
            <p>{esc(a)}</p>
          </details>""" for q, a in items)

def faq_ld(items):
    return {"@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in items]}

WAITLIST = """
    <section id="join" aria-labelledby="join-title">
      <div class="wrap narrow">
        <div class="card tinted">
          <h2 id="join-title">Join the waitlist</h2>
          <p class="muted" style="margin-bottom:14px">We'll email you the App Store link on launch day.</p>
          <div id="tally-wrap"></div>
          <a id="fallback" class="button" href="https://tally.so/r/b50xX7">Join the waitlist</a>
          <p class="small muted" id="direct" hidden style="margin-top:10px">Form not showing? <a href="https://tally.so/r/b50xX7">Open it here</a>.</p>
          <p class="small muted" style="margin-top:10px">Free to start. No card needed. 3 emails at most. To be removed, email <a href="mailto:info@qurek.biz">info@qurek.biz</a>.</p>
        </div>
      </div>
    </section>"""

TALLY_JS = """  <script>
    // The Tally form ID (end of tally.so/r/XXXXXX). Clear it to fall back
    // to the plain button.
    var TALLY_FORM_ID = "b50xX7";
    if (TALLY_FORM_ID && document.getElementById("tally-wrap")) {
      var frame = document.createElement("iframe");
      frame.title = "Acatability waitlist";
      frame.setAttribute("data-tally-src", "https://tally.so/embed/" + TALLY_FORM_ID + "?hideTitle=1&transparentBackground=1&dynamicHeight=1");
      document.getElementById("tally-wrap").appendChild(frame);
      document.getElementById("fallback").remove();
      document.getElementById("direct").hidden = false;
      var s = document.createElement("script");
      s.src = "https://tally.so/widgets/embed.js";
      s.onload = s.onerror = function () {
        if (window.Tally) { window.Tally.loadEmbeds(); }
        else { frame.src = frame.getAttribute("data-tally-src"); }
      };
      document.body.appendChild(s);
    }
  </script>
"""

CAT_JS = """  <script src="/acatability/cat.js"></script>
  <script>
    // The app's cat: tap for a trick and a new line in the speech bubble
    // (typed letter by letter, like in the app). Swatches change his
    // colour. He celebrates when someone joins the waitlist.
    (function () {
      // The hero's two cats touching heads, like the app's sign-in.
      if (document.getElementById("cat-r")) {
        new AcatCat(document.getElementById("cat-r"), { color: "grey", mood: "happy", nuzzle: true });
        new AcatCat(document.getElementById("cat-l"), { color: "calico", mood: "happy", nuzzle: true });
      }
      var cat = new AcatCat(document.getElementById("cat"), { color: "calico" });
      var bubble = document.getElementById("bubble");
      var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var tricks = ["wave", "clap", "jump", "purr"], next = 0;
      var lines = ["Meow!", "Did you check in today?", "Bring a friend. I'll cheer for two.", "Purr...", "I never tell you off.", "Meow! Pick my colour."];
      var line = 0, typing = null;
      function say(text) {
        clearInterval(typing);
        if (still) { bubble.textContent = text; return; }
        var i = 0;
        bubble.textContent = "";
        typing = setInterval(function () {
          bubble.textContent = text.slice(0, ++i);
          if (i >= text.length) clearInterval(typing);
        }, 38);
      }
      document.getElementById("cat-stage").addEventListener("click", function () {
        cat.play(tricks[next]);
        next = (next + 1) % tricks.length;
        line = (line + 1) % lines.length;
        say(lines[line]);
      });
      document.querySelectorAll(".swatches button").forEach(function (b) {
        b.addEventListener("click", function () {
          document.querySelectorAll(".swatches button").forEach(function (o) { o.setAttribute("aria-pressed", "false"); });
          b.setAttribute("aria-pressed", "true");
          cat.setColor(b.getAttribute("data-color"));
          cat.play("jump");
          say("Ooh, " + b.getAttribute("aria-label").toLowerCase() + "!");
        });
      });
      var seen = false;
      new IntersectionObserver(function (es) {
        if (seen || !es[0].isIntersecting) return;
        seen = true;
        setTimeout(function () { cat.play("wave"); next = 1; say("Meow! Tap me."); }, 400);
      }).observe(document.getElementById("cat-stage"));
      window.addEventListener("message", function (e) {
        if (typeof e.data !== "string" || e.data.indexOf("Tally.FormSubmitted") === -1) return;
        cat.setMood("happy");
        say("Yay! See you on launch day.");
        setTimeout(function () { cat.play("jump"); }, 700);
      });
    })();
  </script>
"""

SWATCHES = """<div class="swatches" role="group" aria-label="Pick a cat colour">
            <button type="button" data-color="grey" style="--c:#9AA0A6" aria-label="Grey" aria-pressed="false"></button>
            <button type="button" data-color="orange" style="--c:#E08A3C" aria-label="Orange" aria-pressed="false"></button>
            <button type="button" data-color="white" style="--c:#F2EDE8" aria-label="White" aria-pressed="false"></button>
            <button type="button" data-color="black" style="--c:#3B3238" aria-label="Black" aria-pressed="false"></button>
            <button type="button" data-color="calico" style="--c:conic-gradient(#E08A3C 0 35%, #F2EDE8 0)" aria-label="Calico" aria-pressed="true"></button>
            <button type="button" data-color="tabby" style="--c:repeating-linear-gradient(90deg,#B08256 0 5px,#946A42 5px 8px)" aria-label="Tabby" aria-pressed="false"></button>
          </div>"""

def feature(ic, title, text):
    return f'<div class="card feature">{icon(ic)}<h3>{title}</h3><p>{text}</p></div>'

FEATURES = [
    ("journal", "Private journal", "A few lines a day. Nobody else can ever read them."),
    ("heart", "Gratitude", "Notice the good, even on rough days."),
    ("clock", "Minutes", "Log journalling or meditation. Tap 1, 5, 10."),
    ("friends", "A pact of 5", "See who checked in. Send a paw. Nudge a friend."),
    ("gift", "Cat gifts", "Some days your cat brings a gift. 30 to find."),
    ("star", "Your recap", "Your week, month and year as a little story. Free."),
    ("widget", "Widget", "Your cat on your home screen. Naps until you check in."),
    ("bell", "Gentle hellos", "One a day, only if you want it. Never a telling-off."),
]

PRICE_CARDS = """<div class="grid three">
          <div class="card price-card">
            <h3>Solo</h3>
            <p class="price">Free</p>
            <p class="muted">For good. Check-ins, your whole history, recaps, your cat.</p>
          </div>
          <div class="card price-card best">
            <span class="tag ribbon-tag">For friends</span>
            <h3>Pact</h3>
            <p class="price">£4.99<small> / month</small></p>
            <p class="muted">Or £34.99 a year. You + 4 friends, who join free.</p>
          </div>
          <div class="card price-card">
            <h3>Founding Pact</h3>
            <p class="price">£40<small> once</small></p>
            <p class="muted">One payment, yours for good. On sale until 31 Dec 2026.</p>
          </div>
        </div>"""

# ---------------------------------------------------------------- Home
home_body = f"""
    <section class="hero">
      <div class="wrap">
        <h1 class="sr-only">Acatability</h1>
        <picture>
          <source srcset="/acatability/img/wordmark-dark.png" media="(prefers-color-scheme: dark)" />
          <img class="wordmark-img" src="/acatability/img/wordmark-light.png" width="708" height="138" alt="" fetchpriority="high" />
        </picture>
        <div class="duo" role="img" aria-label="Two cats touching heads">
          <div class="duo-cat right"><canvas id="cat-r"></canvas></div>
          <div class="duo-cat left"><canvas id="cat-l"></canvas></div>
          <svg class="duo-heart" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.3-9.2C1.4 8.4 3.6 5 7 5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8C19.5 16.4 12 21 12 21z"/></svg>
        </div>
        <p class="h1">Tiny habits for your mind. Kept with friends.</p>
        <p class="lede">5 calm minutes a day: journal, gratitude, meditation. Your friends see you showed up. A cat cheers you on.</p>
        <div class="cta-row">
          <a class="button" href="#join">Join the waitlist</a>
          <a class="button ghost" href="/acatability/how-it-works/">See how it works</a>
        </div>
        <p style="margin-top:16px"><span class="tag">{sakura()}iPhone · launching {LAUNCH}</span></p>
      </div>
    </section>

    <section aria-labelledby="steps-title">
      <div class="wrap">
        {heading("3 steps. That's it.", eyebrow="How it works", hid="steps-title")}
        <div class="steps">
          <figure class="step">
            <div class="num">1</div>
            <h3>Check in</h3>
            <p>Write, list a few good things, log your minutes. Only you read it.</p>
            {phone("check-in", "Today's check-in: a private journal, things you're grateful for and minutes spent")}
          </figure>
          <figure class="step">
            <div class="num">2</div>
            <h3>Bring your friends</h3>
            <p>Send a code. Up to 4 friends join your pact, free.</p>
            {phone("pact", "The Pact tab: two cats touching heads, 4 days together, and Priya checked in 12 minutes ago")}
          </figure>
          <figure class="step">
            <div class="num">3</div>
            <h3>Keep it going</h3>
            <p>Show up daily. Your cat goes wild.</p>
            {phone("today", "Today: your cat and your days together")}
          </figure>
        </div>
        <p class="swipe-hint">Swipe for more</p>
      </div>
    </section>

    <section aria-labelledby="cat-title">
      <div class="wrap narrow">
        <div class="card tinted center meet">
          {heading("Meet your cat", sub="6 colours. You pick the name. Go on, tap.", ribbon=True, hid="cat-title")}
          <div class="stage-wrap">
            <p class="bubble" id="bubble" aria-live="polite">Meow!</p>
            <button class="stage" id="cat-stage" type="button" aria-label="The Acatability cat. Tap for a trick">
              <canvas id="cat" aria-hidden="true"></canvas>
            </button>
          </div>
          {SWATCHES}
        </div>
      </div>
    </section>

    <section aria-labelledby="inside-title">
      <div class="wrap">
        {heading("Small, soft and a bit silly", eyebrow="What's inside", hid="inside-title")}
        <div class="grid four">
          {"".join(feature(*f) for f in FEATURES)}
        </div>
      </div>
    </section>

    <section aria-labelledby="recap-title">
      <div class="wrap">
        <div class="split">
          <div>
            <p class="eyebrow">Recap</p>
            <h2 id="recap-title">Your week, as a little story</h2>
            <p class="lede">Days you showed up. Minutes on yourself. Good things you noticed.</p>
            <ul class="ticks">
              <li>Week, month and year.</li>
              <li>Free for everyone.</li>
              <li>Share a picture: numbers and favourites only. Never your journal.</li>
            </ul>
          </div>
          {phone("recap", "Recap: last week, 2 days you showed up, 10 minutes on yourself, and a Play button")}
        </div>
      </div>
    </section>

    <section aria-labelledby="private-title">
      <div class="wrap narrow">
        <div class="card tinted">
          {icon("lock")}
          <h2 id="private-title">Your words stay yours</h2>
          <p class="lede">Friends see that you showed up. Never what you wrote.</p>
          <ul class="ticks">
            <li>Your journal is never shown to anyone.</li>
            <li>You pick what friends see: gratitude, minutes, or nothing.</li>
            <li>No ads. No tracking. No analytics.</li>
            <li>Stored in London. Delete your account any time.</li>
          </ul>
        </div>
      </div>
    </section>

    <section aria-labelledby="price-title">
      <div class="wrap">
        {heading("Free on your own. For good.", sub="One plan brings up to 4 friends in. They join free.", eyebrow="Pricing", hid="price-title")}
        {PRICE_CARDS}
        <p class="center" style="margin-top:18px"><a href="/acatability/pricing/">Full pricing and the 14-day free trial</a></p>
      </div>
    </section>

    <section aria-labelledby="faq-title">
      <div class="wrap narrow">
        {heading("Quick questions", hid="faq-title")}
        <div class="faq">
{faq_html([FAQS[4], FAQS[3], FAQS[6], FAQS[9]])}
        </div>
        <p class="center" style="margin-top:18px"><a href="/acatability/faq/">All questions</a></p>
      </div>
    </section>
{WAITLIST}"""

write("acatability/index.html", page(
    "/acatability/", "Acatability: mental-health habits with friends, and a cat",
    "Acatability is an iPhone app for small daily mental-health habits you keep with friends: a private journal, gratitude and meditation minutes. Friends see you showed up, and a cute cat cheers you on. Free on your own.",
    home_body,
    ld=[{"@type": "WebSite", "@id": f"{BASE}/acatability/#site", "name": "Acatability", "url": f"{BASE}/acatability/",
         "publisher": {"@id": f"{BASE}/#org"}, "inLanguage": "en-GB"}, APP],
    scripts=CAT_JS + TALLY_JS))

# ---------------------------------------------------------------- How it works
def split(eyebrow, hid, title, lede, ticks, img, alt, flip=False):
    t = "".join(f"<li>{x}</li>" for x in ticks)
    return f"""
    <section aria-labelledby="{hid}">
      <div class="wrap">
        <div class="split{' flip' if flip else ''}">
          <div>
            <p class="eyebrow">{eyebrow}</p>
            <h2 id="{hid}">{title}</h2>
            <p class="lede">{lede}</p>
            <ul class="ticks">{t}</ul>
          </div>
          {phone(img, alt)}
        </div>
      </div>
    </section>"""

how_body = f"""
    <div class="wrap">
      <p class="crumbs"><a href="/acatability/">Home</a> · How it works</p>
      {page_title("book", "How it works")}
      <p class="lede">One small check-in a day. Your friends. Your cat. Here's every bit of it.</p>
    </div>
{split("Every day", "checkin-title", "The daily check-in", "About 5 minutes. Morning or night.", [
    "Write a line or two. Only you can read it.",
    "List a few things you're grateful for.",
    "Tap your minutes: journalling or meditation.",
    "Stuck? Ask for a prompt. Want focus? Set an intention.",
], "check-in", "The check-in sheet: journal, grateful for, and minute buttons")}
{split("Together", "pact-title", "Your pact", "A small group that shows up for each other.", [
    "Up to 5 of you. Friends join with a code, free.",
    "See who checked in, and when.",
    "Send a paw. Nudge someone, once a day.",
    "Count the days you all checked in.",
], "pact", "The Pact tab: your pact with Priya, 4 days together, Priya checked in", flip=True)}
{split("Your cat", "cat-title", "A cat in your corner", "Cheers when you show up. Never tells you off.", [
    "6 colours. You choose the name.",
    "Meows, purrs, and a hiss if you pull his tail. He forgives you.",
    "Some days he brings a gift. 30 to find.",
    "Day 1, 7, 30 and 365: a big thank-you.",
], "today", "Today: your cat celebrating a check-in")}
{split("Looking back", "history-title", "History and recaps", "Every day you showed up, in one place.", [
    "List or calendar. Search anything.",
    "Open a day to read it again.",
    "Week, month and year recaps, free.",
], "history", "History: a list of past check-ins with search", flip=True)}
    <section aria-labelledby="extras-title">
      <div class="wrap">
        {heading("Little extras", hid="extras-title")}
        <div class="grid three">
          {feature("bell", "Gentle hellos", "Off until you say yes. One a day, only if you haven't checked in.")}
          {feature("widget", "Home-screen widget", "Your cat naps until you check in, then cheers.")}
          {feature("lock", "Private by design", "No ads, no tracking. Your journal is never shared.")}
        </div>
        <div class="cta-row" style="margin-top:28px"><a class="button" href="/acatability/#join">Join the waitlist</a><a class="button ghost" href="/acatability/pricing/">See pricing</a></div>
      </div>
    </section>"""

write("acatability/how-it-works/index.html", page(
    "/acatability/how-it-works/", "How Acatability works: daily check-ins with friends",
    "How Acatability works: a 5-minute daily check-in (private journal, gratitude, meditation minutes), a pact of up to 5 friends, a cat that cheers you on, and free recaps.",
    how_body, ld=[APP, crumbs_ld([("/acatability/", "Acatability"), ("/acatability/how-it-works/", "How it works")])],
    current="/acatability/how-it-works/"))

# ---------------------------------------------------------------- Pricing
def price_card(name, price, small, note, ticks, best=False, tag=None):
    t = "".join(f"<li>{x}</li>" for x in ticks)
    tg = f'<span class="tag ribbon-tag">{tag}</span>' if tag else ""
    return f"""<div class="card price-card{' best' if best else ''}">{tg}<h2 class="h3">{name}</h2><p class="price">{price}<small>{small}</small></p><p class="muted">{note}</p><ul class="ticks">{t}</ul></div>"""

pricing_faq = [
    ("Is there a free trial?", "Yes. Every new account can try a pact free for 14 days. No card needed, and it never turns into a paid plan by itself."),
    ("Who pays in a pact?", "One person. Everyone they invite joins free. Only the person who pays can invite."),
    ("What if the person paying stops?", "Shared features pause for the pact until anyone in it subscribes. Everyone's journals and days are kept."),
    ("Can I cancel any time?", "Yes. Monthly and yearly plans renew until you cancel in your Apple ID settings, at least 24 hours before the period ends."),
]
pricing_body = f"""
    <div class="wrap">
      <p class="crumbs"><a href="/acatability/">Home</a> · Pricing</p>
      {page_title("tag", "Pricing")}
      <p class="lede">Free on your own, for good. Pay only to bring friends in.</p>
    </div>
    <section aria-label="Plans">
      <div class="wrap">
        <div class="grid three">
          {price_card("Solo", "Free", "", "For good.", ["Daily check-ins", "Your whole history, search and calendar", "Week, month and year recaps", "Your cat and its gifts"])}
          {price_card("Pact", "£4.99", " / month", "Or £34.99 a year (save 42%).", ["You + up to 4 friends", "Friends join free", "See who checked in, send paws", "Days you all checked in"], best=True, tag="For friends")}
          {price_card("Founding Pact", "£40", " once", "On sale until 31 December 2026.", ["Everything in Pact", "One payment, no renewal", "Yours for good"])}
        </div>
        <div class="card tinted" style="margin-top:20px">
          <h2 class="h3">{sakura()} Try a pact free for 14 days</h2>
          <p class="muted">Every new account gets it. No card. It never turns into a paid plan by itself.</p>
        </div>
      </div>
    </section>
    <section aria-labelledby="pq-title">
      <div class="wrap narrow">
        {heading("Money questions", hid="pq-title")}
        <div class="faq">
{faq_html(pricing_faq)}
        </div>
        <p class="small muted center" style="margin-top:18px">Prices are in UK pounds. The App Store shows your local price.</p>
        <div class="cta-row"><a class="button" href="/acatability/#join">Join the waitlist</a></div>
      </div>
    </section>"""

write("acatability/pricing/index.html", page(
    "/acatability/pricing/", "Acatability pricing: free on your own, £4.99 for a pact of 5",
    "Acatability is free on your own, for good. A pact for you and up to 4 friends is £4.99 a month or £34.99 a year, and friends join free. Try it 14 days free, no card.",
    pricing_body, ld=[APP, faq_ld(pricing_faq), crumbs_ld([("/acatability/", "Acatability"), ("/acatability/pricing/", "Pricing")])],
    current="/acatability/pricing/"))

# ---------------------------------------------------------------- FAQ
faq_body = f"""
    <div class="wrap narrow">
      <p class="crumbs"><a href="/acatability/">Home</a> · FAQ</p>
      {page_title("question", "Questions")}
      <p class="lede">Short answers. Tap a question.</p>
    </div>
    <section aria-label="Questions and answers">
      <div class="wrap narrow">
        <div class="faq">
{faq_html(FAQS)}
        </div>
        <p class="center muted" style="margin-top:22px">Something else? Email <a href="mailto:info@qurek.biz">info@qurek.biz</a>.</p>
      </div>
    </section>"""

write("acatability/faq/index.html", page(
    "/acatability/faq/", "Acatability FAQ: price, privacy, friends and the cat",
    "Answers about Acatability: is it free, how many friends can join, can friends read your journal, notifications, privacy and launch date.",
    faq_body, ld=[faq_ld(FAQS), crumbs_ld([("/acatability/", "Acatability"), ("/acatability/faq/", "FAQ")])],
    current="/acatability/faq/"))

# ---------------------------------------------------------------- Guides
GUIDES = []

def guide(slug, title, desc, short, sections, tip):
    GUIDES.append((slug, title, short))
    path = f"/acatability/guides/{slug}/"
    body = f"""
    <div class="wrap">
      <p class="crumbs"><a href="/acatability/">Home</a> · <a href="/acatability/guides/">Guides</a> · {esc(short)}</p>
      <article class="article">
        <h1>{esc(title)}</h1>
        <p class="meta">By the Acatability team · {TODAY[8:]} October 2026 · 3 min read</p>
{sections}
        <div class="note card tinted">
          <h2 class="h3">{sakura()} How Acatability helps</h2>
          <p>{tip}</p>
          <p><a href="/acatability/how-it-works/">See how it works</a></p>
        </div>
      </article>
    </div>"""
    ld = {"@type": "Article", "headline": title, "description": desc, "datePublished": TODAY, "dateModified": TODAY,
          "author": {"@id": f"{BASE}/#org"}, "publisher": {"@id": f"{BASE}/#org"}, "mainEntityOfPage": BASE + path,
          "image": f"{BASE}/acatability/img/og.png", "inLanguage": "en-GB"}
    write(f"acatability/guides/{slug}/index.html", page(
        path, f"{title} | Acatability", desc, body, og_type="article",
        ld=[ld, crumbs_ld([("/acatability/", "Acatability"), ("/acatability/guides/", "Guides"), (path, short)])],
        current="/acatability/guides/"))

guide("habit-with-a-friend", "How to keep a daily habit with a friend",
      "A simple way to keep a small daily habit going with a friend: pick something tiny, agree what counts, share that you showed up (not the details) and plan for missed days.",
      "Habits with a friend", """
        <p>Habits are easy to skip when nobody notices. Doing one with a friend gives you a small reason to show up. Here's a simple way to set it up.</p>
        <h2>1. Pick one tiny habit</h2>
        <p>Smaller than you think. Two lines in a journal. Three good things. Five quiet minutes. Tiny habits survive busy days.</p>
        <h2>2. Pick your people</h2>
        <p>One friend is enough. A small group of 3 to 5 works too. Choose people you already talk to most days.</p>
        <h2>3. Agree what "done" means</h2>
        <p>Make it clear and small. "One line written" counts. Nobody should have to guess if today counted.</p>
        <h2>4. Share that you showed up, not the details</h2>
        <p>You don't need to read each other's journals. Seeing "your friend checked in" is enough to keep you going. Keeping the words private makes it easier to be honest.</p>
        <h2>5. Tie it to something you already do</h2>
        <p>Morning coffee. The bus home. Brushing your teeth at night. Same time, same cue, every day.</p>
        <h2>6. Plan for missed days</h2>
        <p>You will miss one. Agree now: no guilt, no lectures. A common rule is "never miss twice". Just check in the next day.</p>
        <h2>7. Celebrate small wins</h2>
        <p>Day 7. Day 30. The first week you all showed up. Say it out loud. Small wins keep the streak fun.</p>
        <h2>Quick tips</h2>
        <ul>
          <li>Nudge, don't nag. "Saved you a spot" beats "You forgot again".</li>
          <li>Keep it light. It's a habit, not a test.</li>
          <li>Start again any time. Day 1 is always allowed.</li>
        </ul>""",
      "Make a pact with up to 4 friends. Each day you check in privately, and your pact sees that you showed up. You can send a paw or a gentle nudge, and a cat cheers every day you keep it going.")

guide("five-minute-check-in", "A 5-minute daily check-in for your mind",
      "A simple 5-minute daily check-in you can do morning or night: arrive, write a line or two, note three good things and set one small intention.",
      "5-minute check-in", """
        <p>You don't need an hour to look after your head. Five minutes a day is a good start. Here's a check-in you can do morning or night.</p>
        <h2>Minute 1: arrive</h2>
        <p>Put your phone face down after you open your notes. Take three slow breaths. Notice how you feel, without fixing it.</p>
        <h2>Minutes 2 and 3: write a line or two</h2>
        <p>What's on your mind? Write it plainly. "Tired. Big meeting tomorrow." is enough. Nobody is grading this.</p>
        <h2>Minute 4: three good things</h2>
        <p>Small counts. A warm drink. A text from a friend. Sunlight on the floor. Write them down.</p>
        <h2>Minute 5: one small intention</h2>
        <p>One thing for today or tomorrow. "Go outside at lunch." "Reply to Mum." Keep it doable.</p>
        <h2>Morning or night?</h2>
        <ul>
          <li><strong>Morning:</strong> sets the tone. Good for the intention part.</li>
          <li><strong>Night:</strong> winds you down. Good for the good-things part.</li>
        </ul>
        <p>Pick the one you'll actually do. You can switch later.</p>
        <h2>Short on time?</h2>
        <p>Do one minute. One line, one good thing. Showing up matters more than doing it perfectly.</p>""",
      "Acatability's check-in is built around these steps: a private journal, a few good things, your minutes, and an optional intention or prompt. It takes about 5 minutes, and your friends see that you showed up.")

guide("gratitude-on-hard-days", "What to write in a gratitude journal on a hard day",
      "Gratitude prompts for hard days: small, honest things you can write down when nothing feels good, plus why it's fine if you don't feel grateful.",
      "Gratitude on hard days", """
        <p>Some days nothing feels good. That's normal. A gratitude list on a hard day isn't about pretending. It's about noticing one small thing that was okay.</p>
        <h2>You don't have to feel grateful</h2>
        <p>Just write it down. The feeling can come later, or not. Noticing is the habit.</p>
        <h2>15 small prompts</h2>
        <ol>
          <li>Something warm I drank or ate.</li>
          <li>A message from someone.</li>
          <li>Something that went less badly than I feared.</li>
          <li>A sound I liked.</li>
          <li>The best 5 minutes of today.</li>
          <li>Something I'm glad is over.</li>
          <li>A small thing I did for myself.</li>
          <li>Someone who'd be glad to hear from me.</li>
          <li>Something soft: a blanket, a jumper, a pet.</li>
          <li>A thing I'm looking forward to, however tiny.</li>
          <li>Something that made me smile, even a bit.</li>
          <li>A place I felt okay today.</li>
          <li>Something I didn't have to do today.</li>
          <li>A song, show or book that kept me company.</li>
          <li>The fact that today is nearly done.</li>
        </ol>
        <h2>Keep it tiny</h2>
        <p>One item is enough. "Tea" is a full answer. Small and honest beats long and forced.</p>
        <h2>If hard days keep coming</h2>
        <p>A journal is not a replacement for real support. Talk to someone you trust or a doctor. In the UK and Ireland, Samaritans are free on 116 123, any time.</p>""",
      "Each Acatability check-in has a space for a few good things, and the app reminds you: notice the good, even on rough days. Your pact can see your gratitude only if you choose to share it.")

cards = "\n".join(f"""          <a class="card guide-card" href="/acatability/guides/{s}/">{sakura()}<h2 class="h3">{esc(t)}</h2><p class="muted">3 min read</p></a>""" for s, t, _ in GUIDES)
guides_body = f"""
    <div class="wrap">
      <p class="crumbs"><a href="/acatability/">Home</a> · Guides</p>
      {page_title("book", "Guides")}
      <p class="lede">Short, kind how-tos for small daily habits.</p>
    </div>
    <section aria-label="All guides">
      <div class="wrap">
        <div class="grid three">
{cards}
        </div>
      </div>
    </section>"""
write("acatability/guides/index.html", page(
    "/acatability/guides/", "Guides: small daily habits for your mind | Acatability",
    "Short guides on keeping a daily habit with a friend, a 5-minute check-in for your mind, and what to write in a gratitude journal on a hard day.",
    guides_body, ld=[crumbs_ld([("/acatability/", "Acatability"), ("/acatability/guides/", "Guides")]),
                     {"@type": "CollectionPage", "name": "Acatability guides", "url": f"{BASE}/acatability/guides/",
                      "hasPart": [{"@type": "Article", "headline": t, "url": f"{BASE}/acatability/guides/{s}/"} for s, t, _ in GUIDES]}],
    current="/acatability/guides/"))

# ---------------------------------------------------------------- Press
press_body = f"""
    <div class="wrap narrow">
      <p class="crumbs"><a href="/acatability/">Home</a> · Press kit</p>
      {page_title("press", "Press kit")}
      <p class="lede">Writing about Acatability? Everything you need is here. Free to use.</p>
    </div>
    <section aria-labelledby="oneliner-title">
      <div class="wrap narrow">
        <div class="card">
          <h2 class="h3" id="oneliner-title">In one line</h2>
          <p>Acatability is an iPhone app for small daily mental-health habits you keep with friends, with a cat who cheers you on.</p>
          <h2 class="h3" style="margin-top:18px">In a paragraph</h2>
          <p>{esc(APP_DESC)}</p>
        </div>
      </div>
    </section>
    <section aria-labelledby="facts-title">
      <div class="wrap narrow">
        <div class="card">
          <h2 class="h3" id="facts-title">Facts</h2>
          <dl class="facts">
            <dt>Name</dt><dd>Acatability</dd>
            <dt>Platform</dt><dd>iPhone</dd>
            <dt>Launch</dt><dd>{LAUNCH} 2026</dd>
            <dt>Price</dt><dd>Free on your own. Pact for up to 5: £4.99/month or £34.99/year. Founding Pact £40 once, until 31 Dec 2026.</dd>
            <dt>Privacy</dt><dd>Journals are never shared. No ads, no tracking. Data stored in London.</dd>
            <dt>Made by</dt><dd>Qurek Limited, England and Wales</dd>
            <dt>Contact</dt><dd><a href="mailto:info@qurek.biz">info@qurek.biz</a></dd>
          </dl>
        </div>
      </div>
    </section>
    <section aria-labelledby="assets-title">
      <div class="wrap">
        {heading("Images", hid="assets-title")}
        <div class="grid four press-assets">
          <a class="card" href="/acatability/icon.png" download><img src="/acatability/icon.png" width="512" height="512" alt="Acatability app icon" loading="lazy" /><span>App icon</span></a>
          <a class="card" href="/acatability/img/hero-light.png" download><img src="/acatability/img/hero-light.png" width="750" height="660" alt="Acatability logo with two cats" loading="lazy" /><span>Logo and cats</span></a>
          <a class="card" href="/acatability/img/pact.jpg" download><img src="/acatability/img/pact.jpg" width="600" height="1300" alt="Pact screen" loading="lazy" /><span>Pact screen</span></a>
          <a class="card" href="/acatability/img/check-in.jpg" download><img src="/acatability/img/check-in.jpg" width="600" height="1300" alt="Check-in screen" loading="lazy" /><span>Check-in screen</span></a>
        </div>
      </div>
    </section>"""
write("acatability/press/index.html", page(
    "/acatability/press/", "Acatability press kit",
    "Acatability press kit: one-line description, facts, prices, launch date, app icon and screenshots. Contact info@qurek.biz.",
    press_body, ld=[APP, crumbs_ld([("/acatability/", "Acatability"), ("/acatability/press/", "Press kit")])]))

# ---------------------------------------------------------------- robots, sitemap, llms.txt
urls = ["/", "/acatability/", "/acatability/how-it-works/", "/acatability/pricing/", "/acatability/faq/",
        "/acatability/guides/"] + [f"/acatability/guides/{s}/" for s, _, _ in GUIDES] + ["/acatability/press/"]
write("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      "".join(f"  <url><loc>{BASE}{u}</loc><lastmod>{TODAY}</lastmod></url>\n" for u in urls) + "</urlset>\n")

write("robots.txt", f"""# Everyone is welcome, search engines and AI assistants alike
# (Googlebot, Bingbot, GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot...).
User-agent: *
Allow: /

Sitemap: {BASE}/sitemap.xml
""")

faq_md = "\n".join(f"- **{q}** {a}" for q, a in FAQS)
guides_md = "\n".join(f"- [{t}]({BASE}/acatability/guides/{s}/)" for s, t, _ in GUIDES)
write("llms.txt", f"""# Acatability

> Acatability is an iPhone app for small daily mental-health habits you keep with friends, with a cat who cheers you on. Free on your own. Made by Qurek Limited (England and Wales).

{APP_DESC}

## Key facts

- Platform: iPhone (iOS). Not on Android.
- Launch: {LAUNCH} 2026 on the App Store. Waitlist: {BASE}/acatability/#join
- Daily check-in (about 5 minutes): private journal, things you're grateful for, journalling or meditation minutes, optional intention and prompt.
- Pact: you plus up to 4 friends (5 in total). Friends join free with a 6-character invite code. They see that you checked in, plus only what you choose to share. Journals are never shared.
- The cat: 6 colours, you name it; it cheers, meows, purrs, brings gifts (30 to find) and never tells you off.
- Also: free week/month/year recaps, history with search and calendar, home-screen widget, one optional gentle reminder a day.
- Price: Solo free for good. Pact £4.99/month or £34.99/year. Founding Pact £40 one payment, on sale until 31 December 2026. 14-day free pact trial, no card.
- Privacy: no ads, no tracking, no analytics. Data stored in London (UK). Delete your account any time.
- Not a medical or therapy app; makes no health claims.
- Contact: info@qurek.biz

## Pages

- [Home]({BASE}/acatability/)
- [How it works]({BASE}/acatability/how-it-works/)
- [Pricing]({BASE}/acatability/pricing/)
- [FAQ]({BASE}/acatability/faq/)
- [Press kit]({BASE}/acatability/press/)
- [Privacy policy](https://niacod.github.io/acatability-legal/privacy)
- [Terms of use](https://niacod.github.io/acatability-legal/terms)

## Guides

{guides_md}

## FAQ

{faq_md}
""")
print("built", len(urls), "urls")
