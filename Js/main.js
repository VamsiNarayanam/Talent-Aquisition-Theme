(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("js");
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const pre = $("#preloader");
  if (pre) {
    const bar = pre.querySelector(".meter > span");
    const num = pre.querySelector("[data-meter]");
    const word = pre.querySelector("[data-pre-word]");
    const stage = pre.querySelector("[data-pre-stage]");
    const beats = [
      { word: "Brief", stage: "Opening the board" },
      { word: "Shortlist", stage: "Reading the brief" },
      { word: "Offer", stage: "Setting the desk" },
    ];
    let beat = 0;
    let progress = 0;
    let wordTimer = 0;
    const setBeat = (i) => {
      const next = beats[i % beats.length];
      if (word) {
        word.classList.add("is-swap");
        clearTimeout(wordTimer);
        wordTimer = setTimeout(() => {
          word.textContent = next.word;
          word.classList.remove("is-swap");
        }, reduce ? 0 : 160);
      }
      if (stage) stage.textContent = next.stage;
    };
    setBeat(0);
    const finish = () => {
      if (pre.classList.contains("is-done")) return;
      if (bar) bar.style.width = "100%";
      if (num) num.textContent = "100";
      setBeat(2);
      pre.classList.add("is-done");
      pre.setAttribute("aria-hidden", "true");
      document.body.classList.remove("is-loading");
    };
    const tick = () => {
      if (reduce) {
        finish();
        return;
      }
      progress = Math.min(100, progress + 5 + Math.random() * 7);
      if (bar) bar.style.width = progress + "%";
      if (num) num.textContent = String(Math.floor(progress)).padStart(2, "0");
      const nextBeat = progress < 36 ? 0 : progress < 72 ? 1 : 2;
      if (nextBeat !== beat) {
        beat = nextBeat;
        setBeat(beat);
      }
      if (progress >= 100) setTimeout(finish, 180);
      else setTimeout(tick, 46);
    };
    window.addEventListener("load", () => setTimeout(tick, reduce ? 0 : 120));
    setTimeout(finish, 3200);
  }

  const header = $("#site-header");
  if (header) {
    const onScroll = () => header.classList.toggle("is-shrink", window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  const drawer = $("#drawer");
  const toggle = $(".nav-toggle");
  const setDrawer = (open) => {
    if (!drawer || !toggle) return;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    toggle.classList.toggle("is-active", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (!document.body.classList.contains("dash-page") && !document.body.classList.contains("auth-page")) {
      document.body.style.overflow = open ? "hidden" : "";
    }
  };
  toggle?.addEventListener("click", () => setDrawer(!drawer.classList.contains("is-open")));
  drawer?.addEventListener("click", (e) => {
    if (e.target === drawer || e.target.closest("a")) setDrawer(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setDrawer(false);
  });

  if (window.AOS && !reduce) {
    AOS.init({ duration: 650, easing: "ease-out-cubic", once: true, offset: 28 });
  } else {
    document.documentElement.classList.add("show-all");
  }

  const toast = $("#toast");
  const showToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("is-on");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("is-on"), 3200);
  };
  window.staToast = showToast;

  const runMeter = (meter, running) => {
    if (!meter) return;
    const fill = meter.querySelector("span");
    meter.classList.remove("is-run");
    if (fill) fill.style.width = "0";
    void meter.offsetWidth;
    if (running && !reduce) meter.classList.add("is-run");
    else if (fill) fill.style.width = "100%";
  };

  const bindAutoplay = (root, { holdMs, onTick, pauseEls }) => {
    let timer = 0;
    let paused = false;
    const stop = () => {
      clearInterval(timer);
      timer = 0;
    };
    const start = () => {
      stop();
      if (reduce || paused) return;
      timer = setInterval(onTick, holdMs);
    };
    const pause = () => { paused = true; stop(); };
    const resume = () => { paused = false; start(); };
    (pauseEls || [root]).forEach((el) => {
      if (!el) return;
      el.addEventListener("mouseenter", pause);
      el.addEventListener("mouseleave", resume);
      el.addEventListener("focusin", pause);
      el.addEventListener("focusout", (e) => {
        if (!el.contains(e.relatedTarget)) resume();
      });
    });
    return { start, stop, pause, resume, restart: start };
  };

  const briefSwipe = $("[data-brief-swipe]");
  if (briefSwipe) {
    const track = $("[data-brief-track]", briefSwipe);
    const slides = $$(".brief-slide", briefSwipe);
    const dotsHost = $("[data-brief-dots]", briefSwipe);
    const progress = $(".brief-progress", briefSwipe);
    const nowEl = $("[data-brief-now]");
    const totalEl = $("[data-brief-total]");
    const holdMs = 4500;
    let index = 0;

    if (totalEl) totalEl.textContent = String(slides.length).padStart(2, "0");

    const offsetFor = (i) => {
      if (!slides[i] || !track) return 0;
      const view = track.parentElement;
      const max = Math.max(0, track.scrollWidth - (view ? view.clientWidth : 0));
      return Math.min(slides[i].offsetLeft, max);
    };

    const go = (n) => {
      if (!slides.length || !track) return;
      index = ((n % slides.length) + slides.length) % slides.length;
      track.style.transform = "translate3d(-" + offsetFor(index) + "px,0,0)";
      slides.forEach((slide, i) => slide.classList.toggle("is-on", i === index));
      if (dotsHost) {
        $$("button", dotsHost).forEach((dot, i) => dot.classList.toggle("is-on", i === index));
      }
      if (nowEl) nowEl.textContent = String(index + 1).padStart(2, "0");
      runMeter(progress, true);
    };

    if (dotsHost) {
      dotsHost.innerHTML = "";
      slides.forEach((_, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.setAttribute("aria-label", "Brief " + String(i + 1));
        btn.addEventListener("click", () => {
          go(i);
          auto.restart();
        });
        dotsHost.appendChild(btn);
      });
    }

    const auto = bindAutoplay(briefSwipe, {
      holdMs,
      onTick: () => go(index + 1),
    });

    $("[data-brief-next]")?.addEventListener("click", () => { go(index + 1); auto.restart(); });
    $("[data-brief-prev]")?.addEventListener("click", () => { go(index - 1); auto.restart(); });

    let touchX = 0;
    briefSwipe.addEventListener("touchstart", (e) => {
      touchX = e.changedTouches[0].clientX;
      auto.pause();
    }, { passive: true });
    briefSwipe.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
      auto.resume();
    }, { passive: true });

    window.addEventListener("resize", () => go(index));
    go(0);
    auto.start();
  }

  const doors = $("[data-doors]");
  if (doors) {
    const latches = $$("[data-door]", doors);
    const panels = $$("[data-door-panel]", doors);
    const meter = $(".door-meter", doors);
    const holdMs = 5500;
    let idx = Math.max(0, latches.findIndex((t) => t.classList.contains("is-on")));

    const open = (id) => {
      latches.forEach((tab) => {
        const on = tab.dataset.door === id;
        tab.classList.toggle("is-on", on);
        tab.setAttribute("aria-pressed", on ? "true" : "false");
      });
      panels.forEach((panel) => {
        panel.classList.toggle("is-on", panel.dataset.doorPanel === id);
      });
      idx = Math.max(0, latches.findIndex((t) => t.dataset.door === id));
      runMeter(meter, true);
    };

    const auto = bindAutoplay(doors, {
      holdMs,
      onTick: () => {
        const next = latches[(idx + 1) % latches.length];
        if (next) open(next.dataset.door);
      },
    });

    latches.forEach((tab) => tab.addEventListener("click", () => {
      open(tab.dataset.door);
      auto.restart();
    }));

    if (latches[idx]) open(latches[idx].dataset.door);
    auto.start();
  }

  const acts = $("[data-acts]");
  if (acts && window.STA) {
    const buttons = $$("[data-act]", acts);
    const frames = $$(".act-frame img", acts);
    const title = $("[data-act-title]", acts);
    const copy = $("[data-act-copy]", acts);
    const folio = $("[data-act-folio]", acts);
    const big = $("[data-act-big]", acts);
    const ofEl = $("[data-act-of]", acts);
    const meter = $(".act-meter", acts);
    const holdMs = 5000;
    let idx = 0;

    const show = (n) => {
      idx = ((Number(n) % buttons.length) + buttons.length) % buttons.length;
      buttons.forEach((btn) => {
        const i = Number(btn.dataset.act);
        const on = i === idx;
        btn.classList.toggle("is-on", on);
        btn.classList.toggle("is-done", i < idx);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
      frames.forEach((img, k) => img.classList.toggle("is-on", k === idx));
      const item = STA.acts[idx];
      const pad = String(idx + 1).padStart(2, "0");
      if (item) {
        if (title) title.textContent = item.title;
        if (copy) copy.textContent = item.copy;
      }
      if (folio) folio.textContent = "Act " + pad;
      if (big) big.textContent = pad;
      if (ofEl) ofEl.textContent = (idx + 1) + " / " + buttons.length;
      runMeter(meter, true);
    };

    const auto = bindAutoplay(acts, {
      holdMs,
      onTick: () => show(idx + 1),
    });

    buttons.forEach((btn) => btn.addEventListener("click", () => {
      show(btn.dataset.act);
      auto.restart();
    }));

    show(0);
    auto.start();
  }

  const wire = $("[data-wire]");
  if (wire) {
    const items = $$("[data-wire-item]", wire);
    const title = $("[data-wire-title]", wire);
    const copy = $("[data-wire-copy]", wire);
    const time = $("[data-wire-time]", wire);
    const meter = $(".wire-meter", wire);
    const holdMs = 5000;
    let idx = Math.max(0, items.findIndex((el) => el.classList.contains("is-on")));

    const show = (n) => {
      if (!items.length) return;
      idx = ((Number(n) % items.length) + items.length) % items.length;
      const item = items[idx];
      items.forEach((el, i) => el.classList.toggle("is-on", i === idx));
      if (title) title.textContent = item.getAttribute("data-title") || "";
      if (copy) copy.textContent = item.getAttribute("data-copy") || "";
      if (time) time.textContent = item.getAttribute("data-time") || "";
      runMeter(meter, true);
    };

    const auto = bindAutoplay(wire, {
      holdMs,
      onTick: () => show(idx + 1),
    });

    items.forEach((item, i) => item.addEventListener("click", () => {
      show(i);
      auto.restart();
    }));

    show(idx);
    auto.start();
  }

  const board = $("[data-stages]");
  if (board) {
    const stages = $$("[data-stage]", board);
    const note = board.querySelector("[data-stage-note]");
    const title = board.querySelector("[data-stage-title]");
    const folio = board.querySelector("[data-stage-folio]");
    const big = board.querySelector("[data-stage-big]");
    const fill = board.querySelector("[data-stage-fill]");
    const activate = (stage) => {
      if (!stage) return;
      stages.forEach((item) => item.classList.toggle("is-on", item === stage));
      if (note) note.textContent = stage.getAttribute("data-note") || "";
      if (title) title.textContent = stage.getAttribute("data-title") || stage.querySelector("strong")?.textContent || "";
      const idx = stage.querySelector(".idx")?.textContent || "01";
      if (folio) folio.textContent = idx;
      if (big) big.textContent = idx;
      const i = Number(stage.getAttribute("data-i") || "0");
      if (fill) fill.style.width = ((i + 1) / Math.max(stages.length, 1)) * 100 + "%";
    };
    stages.forEach((stage) => stage.addEventListener("click", () => activate(stage)));
  }

  const years = $("[data-years]");
  if (years) {
    const buttons = $$("[data-year]", years);
    const panels = $$("[data-year-panel]", years);
    const big = $("[data-year-big]", years);
    const select = (year) => {
      buttons.forEach((btn) => {
        const on = btn.dataset.year === year;
        btn.classList.toggle("is-on", on);
        btn.setAttribute("aria-selected", on ? "true" : "false");
      });
      panels.forEach((panel) => {
        const on = panel.getAttribute("data-year-panel") === year;
        panel.classList.toggle("is-on", on);
        panel.hidden = !on;
      });
      if (big) big.textContent = year;
    };
    buttons.forEach((btn) => btn.addEventListener("click", () => select(btn.dataset.year)));
  }

  $$(".faq-list").forEach((list) => {
    $$("details.faq", list).forEach((item) => {
      item.addEventListener("toggle", () => {
        if (!item.open) return;
        $$("details.faq", list).forEach((other) => {
          if (other !== item) other.open = false;
        });
      });
    });
  });

  const indexRoot = $("[data-index]");
  if (indexRoot) {
    const filters = $("[data-filter]", indexRoot);
    const cards = $$("[data-article]", indexRoot);
    const countEl = $("[data-index-count]", indexRoot);
    const emptyEl = $("[data-index-empty]", indexRoot);

    const paintIndex = (cat) => {
      let shown = 0;
      cards.forEach((card) => {
        const match = cat === "all" || card.dataset.article === cat;
        card.hidden = !match;
        card.classList.toggle("is-out", !match);
        if (match) {
          shown += 1;
          card.classList.add("aos-animate");
          card.style.opacity = "";
          card.style.transform = "";
        }
      });
      if (countEl) countEl.textContent = shown === 1 ? "1 note" : `${shown} notes`;
      if (emptyEl) emptyEl.hidden = shown > 0;
      // Filtering changes page height; reveal AOS items that jumped into view.
      requestAnimationFrame(() => {
        if (window.AOS && typeof window.AOS.refresh === "function") {
          window.AOS.refresh();
        }
        $$("[data-aos]", document).forEach((el) => {
          const rect = el.getBoundingClientRect();
          const inView = rect.top < window.innerHeight * 0.95 && rect.bottom > 0;
          if (inView) {
            el.classList.add("aos-animate");
            el.style.opacity = "";
            el.style.transform = "";
          }
        });
      });
    };

    filters?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-cat]");
      if (!btn || !filters.contains(btn)) return;
      $$("[data-cat]", filters).forEach((item) => {
        const on = item === btn;
        item.classList.toggle("is-on", on);
        item.setAttribute("aria-selected", on ? "true" : "false");
      });
      paintIndex(btn.dataset.cat || "all");
    });

    paintIndex("all");
  }

  const fieldHost = (field) => field.closest("[data-field]") || field.parentElement;
  const markFields = (form) => {
    let ok = true;
    $$("[required]", form).forEach((field) => {
      if (field.type === "radio") return;
      const host = fieldHost(field);
      const err = host.querySelector(".field-error");
      let bad = field.type === "checkbox" ? !field.checked : !String(field.value).trim();
      if (field.type === "email") bad = !field.value.includes("@") || !field.value.includes(".");
      field.classList.toggle("input-err", bad);
      err?.classList.toggle("is-on", bad);
      if (bad) ok = false;
    });
    return ok;
  };

  $("[data-news]")?.addEventListener("submit", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const form = e.target;
    const email = form.querySelector('input[type="email"]');
    const value = String(email?.value || "").trim();
    const bad = !value || !value.includes("@") || !value.includes(".");
    email?.classList.toggle("input-err", bad);
    form.querySelector(".field-error")?.classList.toggle("is-on", bad);
    if (bad) {
      showToast("Enter a valid work email for the capacity list.");
      email?.focus();
      return false;
    }
    if (email) email.value = "";
    form.reset();
    email?.classList.remove("input-err");
    form.querySelector(".field-error")?.classList.remove("is-on");
    location.href = "404.html";
  });

  $("[data-contact]")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    if (!markFields(form)) {
      showToast("Complete the marked fields before the brief can be filed.");
      return;
    }
    form.reset();
    location.href = "404.html";
  });

  $$("[data-pass]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = $(btn.getAttribute("data-pass"));
      if (!input) return;
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.textContent = show ? "Hide" : "Show";
      btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });
  });

  $("[data-forgot]")?.addEventListener("click", () => {
    location.href = "404.html";
  });

  const users = () => (window.STA && STA.demoUsers) || {};

  $("[data-login]")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    if (!markFields(form)) {
      showToast("Complete the marked fields before the session can open.");
      return;
    }
    const email = form.email.value.trim().toLowerCase();
    const pass = form.password.value;
    const role = form.querySelector('input[name="role"]:checked')?.value || "client";
    const name = form.name.value.trim();
    if (!email || !email.includes("@") || !email.includes(".")) {
      showToast("Enter a valid email before continuing.");
      return;
    }
    if (pass.length < 6) {
      showToast("Password must be at least 6 characters.");
      return;
    }
    const session = {
      name: name || "Desk user",
      email,
      role,
    };
    localStorage.setItem("sta_session", JSON.stringify(session));
    location.href = session.role === "admin" ? "admin-dashboard.html" : "client-dashboard.html";
  });

  $("[data-register]")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    if (!markFields(form)) {
      showToast("Complete the marked fields to open an account.");
      return;
    }
    const pass = form.password.value;
    const confirm = form.confirm.value;
    if (pass.length < 6) {
      showToast("Password must be at least 6 characters.");
      return;
    }
    if (pass !== confirm) {
      showToast("Password and confirm do not match.");
      return;
    }
    const record = {
      name: form.name.value.trim(),
      email: form.email.value.trim().toLowerCase(),
      pass,
      role: form.querySelector('input[name="role"]:checked')?.value || "client",
      company: form.company.value.trim(),
    };
    localStorage.setItem("sta_registered_user", JSON.stringify(record));
    showToast("Account saved on this browser. Sign in to open the desk.");
    setTimeout(() => { location.href = "login.html"; }, 700);
  });

  const year = $("#y");
  if (year) year.textContent = String(new Date().getFullYear());

  $("[data-back]")?.addEventListener("click", () => {
    if (window.history.length > 1) window.history.back();
    else location.href = "index.html";
  });

  const heroRoots = $$("[data-hero]");
  if (heroRoots.length) {
    const spinPhrases = [
      "Not CVs that pile.",
      "Not vibes that hire.",
      "Not folders of maybe.",
    ];

    heroRoots.forEach((hero) => {
      const spin = hero.querySelector("[data-hero-spin]");
      const slideHost = hero.querySelector("[data-hero-slides]") || hero.querySelector(".hero-media");
      const slides = slideHost ? $$("img", slideHost) : [];
      const dots = $$("[data-hero-dot]", hero);
      let index = Math.max(0, slides.findIndex((img) => img.classList.contains("is-on")));
      if (index < 0) index = 0;

      const paint = (next) => {
        if (!slides.length) return;
        index = (next + slides.length) % slides.length;
        slides.forEach((img, i) => img.classList.toggle("is-on", i === index));
        dots.forEach((dot, i) => dot.classList.toggle("is-on", i === index));
      };

      if (slides.length > 1 && !reduce) {
        let timer = setInterval(() => paint(index + 1), 4500);
        dots.forEach((dot) => {
          dot.addEventListener("click", () => {
            clearInterval(timer);
            paint(Number(dot.dataset.heroDot) || 0);
            timer = setInterval(() => paint(index + 1), 4500);
          });
        });
      }

      if (spin && !reduce) {
        let i = 0;
        setInterval(() => {
          i = (i + 1) % spinPhrases.length;
          spin.classList.add("is-swap");
          setTimeout(() => {
            spin.textContent = spinPhrases[i];
            spin.classList.remove("is-swap");
          }, 200);
        }, 3400);
      }
    });
  }

})();
