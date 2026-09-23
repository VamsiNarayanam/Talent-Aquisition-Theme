(function () {
  let session = null;
  try { session = JSON.parse(localStorage.getItem("sta_session") || "null"); } catch (err) { session = null; }
  const pageRole = document.body.getAttribute("data-role");
  if (!session || !session.email) {
    location.href = "login.html";
    return;
  }
  if (pageRole && session.role !== pageRole) {
    location.href = session.role === "admin" ? "admin-dashboard.html" : "client-dashboard.html";
    return;
  }

  const tidy = (raw, email) => {
    let name = String(raw || "").trim().replace(/\s+/g, " ");
    if (!name || name.includes("@")) name = String(email || "").split("@")[0].replace(/[._-]+/g, " ");
    return name.replace(/\S+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));
  };
  const initials = (name) => {
    const parts = name.split(" ").filter(Boolean);
    return ((parts[0]?.[0] || "S") + (parts[1]?.[0] || parts[0]?.[1] || "T")).toUpperCase();
  };
  const displayName = tidy(session.name, session.email);
  const mail = String(session.email || "").trim().toLowerCase();
  const whoName = document.querySelector("[data-who-name]");
  const whoMail = document.querySelector("[data-who-mail]");
  const whoMark = document.querySelector("[data-who-initials]");
  if (whoName) whoName.textContent = displayName;
  if (whoMail) whoMail.textContent = mail;
  if (whoMark) whoMark.textContent = initials(displayName);

  document.querySelectorAll("[data-logout]").forEach((btn) => {
    btn.addEventListener("click", () => {
      localStorage.removeItem("sta_session");
      location.href = "login.html";
    });
  });

  const toast = (msg) => {
    let el = document.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      el.id = "toast";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("is-on");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("is-on"), 2800);
  };

  const buttons = document.querySelectorAll(".side-nav [data-panel]");
  const panels = document.querySelectorAll(".panel");
  const title = document.querySelector("[data-panel-title]");
  const side = document.querySelector(".dash-side");
  const scrim = document.querySelector(".dash-scrim");
  const burger = document.querySelector(".dash-burger");
  const setSide = (open) => {
    side?.classList.toggle("is-open", open);
    scrim?.classList.toggle("is-on", open);
    burger?.classList.toggle("is-active", open);
    burger?.setAttribute("aria-expanded", open ? "true" : "false");
    burger?.setAttribute("aria-label", open ? "Close sections" : "Open sections");
  };
  const closeSide = () => setSide(false);
  const activate = (id) => {
    buttons.forEach((btn) => btn.classList.toggle("is-on", btn.dataset.panel === id));
    panels.forEach((panel) => panel.classList.toggle("is-on", panel.id === "panel-" + id));
    const label = document.querySelector('.side-nav [data-panel="' + id + '"]')?.textContent || "Overview";
    if (title) title.textContent = label.trim();
    document.querySelector(".dash-main")?.scrollTo(0, 0);
    if (history.replaceState) history.replaceState(null, "", "#" + id);
    closeSide();
  };
  buttons.forEach((btn) => btn.addEventListener("click", () => activate(btn.dataset.panel)));
  const hash = location.hash.replace("#", "");
  if (hash && document.getElementById("panel-" + hash)) activate(hash);

  burger?.addEventListener("click", () => {
    setSide(!side?.classList.contains("is-open"));
  });
  scrim?.addEventListener("click", closeSide);
  document.querySelector("[data-side-close]")?.addEventListener("click", closeSide);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSide();
  });

  document.querySelectorAll("[data-demo-toast]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toast(btn.getAttribute("data-demo-toast"));
    });
  });
  document.querySelectorAll("[data-save], [data-compose]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const msg = form.getAttribute("data-save") || form.getAttribute("data-compose") || "Saved on this browser (demo).";
      toast(msg);
    });
  });

  document.querySelectorAll(".filter-bar").forEach((bar) => {
    bar.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn || !bar.contains(btn)) return;
      bar.querySelectorAll("button").forEach((item) => item.classList.toggle("is-on", item === btn));
    });
  });
})();
