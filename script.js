"use strict";

/* ====== Configuração (edite aqui) ====== */
const CONFIG = {
  githubUser: "danilotomassoni",
  contactEmail: "daniloaugustotomassoni@gmail.com",
  roles: ["crio sites responsivos.", "cuido da acessibilidade.", "gosto de aprender."],
  maxRepos: 30,
};

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ====== Tema claro/escuro ====== */
(function theme() {
  const root = document.documentElement;
  const saved = localStorage.getItem("theme");
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  root.dataset.theme = saved || (prefersLight ? "light" : "dark");

  $("#themeToggle").addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    localStorage.setItem("theme", next);
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = next === "dark" ? "#0b1020" : "#f6f8ff";
  });
})();

/* ====== Menu mobile ====== */
(function menu() {
  const burger = $("#burger");
  const list = $("#navList");
  const close = () => {
    list.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
  };
  burger.addEventListener("click", () => {
    const open = list.classList.toggle("open");
    burger.setAttribute("aria-expanded", String(open));
  });
  $$(".nav__link").forEach((a) => a.addEventListener("click", close));
  document.addEventListener("keydown", (e) => e.key === "Escape" && close());
  window.addEventListener("resize", () => window.innerWidth > 760 && close());
})();

/* ====== Rolagem: header, progresso, voltar ao topo ====== */
(function scrollFx() {
  const header = $("#header");
  const progress = $("#progress");
  const toTop = $("#toTop");
  let ticking = false;

  const update = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    header.classList.toggle("scrolled", y > 10);
    progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    toTop.classList.toggle("show", y > 600);
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();

  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
})();

/* ====== Link ativo no menu ====== */
(function activeLink() {
  const links = $$(".nav__link");
  const map = new Map(links.map((l) => [l.getAttribute("href").slice(1), l]));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        links.forEach((l) => l.classList.remove("active"));
        map.get(en.target.id)?.classList.add("active");
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach((s) => io.observe(s));
})();

/* ====== Revelar elementos + barras + contadores ====== */
(function reveal() {
  const animateCount = (el) => {
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || "";
    const dur = 1400;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.classList.add("in");
      $$(".bar__fill", el).forEach((b) => (b.style.width = b.dataset.level + "%"));
      $$("[data-count]", el).forEach(animateCount);
      io.unobserve(el);
    });
  }, { threshold: 0.15 });

  $$(".reveal").forEach((el) => io.observe(el));
})();

/* ====== Efeito de digitação ====== */
(function typing() {
  const el = $("#typed");
  if (!el) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.textContent = CONFIG.roles[0];
    return;
  }
  let r = 0, c = 0, deleting = false;
  const step = () => {
    const word = CONFIG.roles[r];
    el.textContent = word.slice(0, c);
    let delay = deleting ? 35 : 75;
    if (!deleting && c === word.length) { deleting = true; delay = 1600; }
    else if (deleting && c === 0) { deleting = false; r = (r + 1) % CONFIG.roles.length; delay = 400; }
    c += deleting ? -1 : 1;
    setTimeout(step, delay);
  };
  step();
})();

/* ====== Projetos via API do GitHub ====== */
(async function repos() {
  const grid = $("#repos");
  const msg = $("#reposMsg");
  const filtersEl = $("#filters");
  const search = $("#search");
  let all = [];
  let lang = "Todos";

  const colors = { JavaScript: "#f1e05a", HTML: "#e34c26", CSS: "#563d7c", TypeScript: "#3178c6", Python: "#3572a5", Java: "#b07219", PHP: "#4f5d95", C: "#555555", "C++": "#f34b7d", "C#": "#178600", Go: "#00add8", Shell: "#89e051" };
  const esc = (s = "") => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const render = () => {
    const q = search.value.trim().toLowerCase();
    const list = all.filter((r) =>
      (lang === "Todos" || r.language === lang) &&
      (!q || r.name.toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q))
    );
    grid.innerHTML = list.map((r, i) => `
      <article class="card" style="animation-delay:${Math.min(i * 40, 400)}ms">
        <h3>${esc(r.name)}</h3>
        <p>${esc(r.description || "Sem descrição.")}</p>
        <div class="card__meta">
          ${r.language ? `<span><i class="dot" style="background:${colors[r.language] || "var(--primary)"}"></i>${esc(r.language)}</span>` : ""}
          <span>★ ${r.stargazers_count}</span>
          <span>⑂ ${r.forks_count}</span>
        </div>
        <div class="card__links">
          <a href="${r.html_url}" target="_blank" rel="noopener">Código →</a>
          ${r.homepage ? `<a href="${esc(r.homepage)}" target="_blank" rel="noopener">Demo →</a>` : ""}
        </div>
      </article>`).join("");
    msg.hidden = list.length > 0;
    if (!list.length) msg.textContent = "Nenhum projeto encontrado.";
  };

  const buildFilters = () => {
    const langs = ["Todos", ...new Set(all.map((r) => r.language).filter(Boolean))];
    filtersEl.innerHTML = langs.map((l) => `<button class="chip ${l === lang ? "active" : ""}" data-lang="${esc(l)}">${esc(l)}</button>`).join("");
  };

  filtersEl.addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (!b) return;
    lang = b.dataset.lang;
    $$(".chip", filtersEl).forEach((c) => c.classList.toggle("active", c === b));
    render();
  });
  search.addEventListener("input", render);

  try {
    const cached = sessionStorage.getItem("repos");
    let data = cached ? JSON.parse(cached) : null;
    if (!data) {
      const res = await fetch(`https://api.github.com/users/${CONFIG.githubUser}/repos?sort=updated&per_page=${CONFIG.maxRepos}`);
      if (!res.ok) throw new Error("HTTP " + res.status);
      data = await res.json();
      sessionStorage.setItem("repos", JSON.stringify(data));
    }
    all = data.filter((r) => !r.fork && r.name.toLowerCase() !== `${CONFIG.githubUser}.github.io`);
    if (!all.length) {
      grid.innerHTML = "";
      msg.hidden = false;
      msg.textContent = "Ainda não há repositórios públicos para exibir.";
      return;
    }
    buildFilters();
    render();
  } catch (err) {
    grid.innerHTML = "";
    msg.hidden = false;
    msg.innerHTML = `Não foi possível carregar os projetos agora. Veja direto em <a href="https://github.com/${CONFIG.githubUser}" target="_blank" rel="noopener" style="color:var(--primary)">github.com/${CONFIG.githubUser}</a>.`;
  }
})();

/* ====== Formulário de contato (abre o app de e-mail) ====== */
(function form() {
  const f = $("#form");
  const status = $("#formStatus");
  const rules = {
    nome: (v) => (v.trim().length >= 2 ? "" : "Informe seu nome."),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Informe um e-mail válido."),
    msg: (v) => (v.trim().length >= 10 ? "" : "Escreva ao menos 10 caracteres."),
  };

  const validate = (input) => {
    const err = rules[input.name](input.value);
    const field = input.closest(".field");
    field.classList.toggle("invalid", !!err);
    $(".error", field).textContent = err;
    return !err;
  };

  $$("input, textarea", f).forEach((i) => i.addEventListener("blur", () => validate(i)));

  f.addEventListener("submit", (e) => {
    e.preventDefault();
    const ok = $$("input, textarea", f).map(validate).every(Boolean);
    if (!ok) return;
    const d = new FormData(f);
    const subject = encodeURIComponent(`Contato pelo site - ${d.get("nome")}`);
    const body = encodeURIComponent(`${d.get("msg")}\n\n${d.get("nome")} (${d.get("email")})`);
    window.location.href = `mailto:${CONFIG.contactEmail}?subject=${subject}&body=${body}`;
    status.textContent = "Abrindo seu aplicativo de e-mail...";
    toast("Mensagem preparada!");
    f.reset();
  });
})();

/* ====== Toast ====== */
function toast(text) {
  const t = $("#toast");
  t.textContent = text;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 2800);
}

/* ====== Ano no rodapé ====== */
$("#year").textContent = new Date().getFullYear();
