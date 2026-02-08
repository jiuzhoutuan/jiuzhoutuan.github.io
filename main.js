// ====== Language (CN/EN) ======
const LANG_KEY = "jiuzhou_lang";
const supported = ["zh", "en"];

function getLang() {
  const saved = localStorage.getItem(LANG_KEY);
  if (supported.includes(saved)) return saved;
  // 默认中文
  return "zh";
}

function setLang(lang) {
  if (!supported.includes(lang)) return;
  localStorage.setItem(LANG_KEY, lang);
  applyLang(lang);
  updateLangButtons(lang);
}

function applyLang(lang) {
  // data-i18n elements: set textContent
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const zh = el.getAttribute("data-zh") ?? "";
    const en = el.getAttribute("data-en") ?? "";
    el.textContent = (lang === "en") ? en : zh;
  });

  // data-i18n-placeholder elements: set placeholder
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const zh = el.getAttribute("data-zh-placeholder") ?? "";
    const en = el.getAttribute("data-en-placeholder") ?? "";
    el.placeholder = (lang === "en") ? en : zh;
  });

  // data-i18n-title: set document title or element title attribute
  document.querySelectorAll("[data-i18n-title]").forEach(el => {
    const zh = el.getAttribute("data-zh-title") ?? "";
    const en = el.getAttribute("data-en-title") ?? "";
    el.setAttribute("title", (lang === "en") ? en : zh);
  });
}

function updateLangButtons(lang) {
  const btnZh = document.getElementById("btn-zh");
  const btnEn = document.getElementById("btn-en");
  if (btnZh && btnEn) {
    btnZh.classList.toggle("active", lang === "zh");
    btnEn.classList.toggle("active", lang === "en");
  }
}

function initLang() {
  const lang = getLang();
  applyLang(lang);
  updateLangButtons(lang);

  const btnZh = document.getElementById("btn-zh");
  const btnEn = document.getElementById("btn-en");
  if (btnZh) btnZh.addEventListener("click", () => setLang("zh"));
  if (btnEn) btnEn.addEventListener("click", () => setLang("en"));
}

// ====== Members (render on members.html) ======
const members = [
  { name: "九州丨奉孝", roleZh: "主力", roleEn: "Core" },
  { name: "九州丨XX", roleZh: "管理", roleEn: "Staff" },
  { name: "九州丨XX", roleZh: "攻城", roleEn: "Siege" },
  { name: "九州丨XX", roleZh: "主力", roleEn: "Core" },
];

function renderMembers() {
  const el = document.getElementById("members");
  if (!el) return;

  const lang = getLang();
  el.innerHTML = members.map(m => `
    <div class="member">
      <div class="name">${m.name}</div>
      <div class="role">${lang === "en" ? m.roleEn : m.roleZh}</div>
    </div>
  `).join("");
}

// ====== Init ======
document.addEventListener("DOMContentLoaded", () => {
  initLang();
  renderMembers();
});
