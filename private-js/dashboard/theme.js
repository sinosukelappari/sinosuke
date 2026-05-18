(function (window, document) {
  "use strict";

  const STORAGE_KEY = "sinosuke_theme";
  const LIGHT_CLASS = "theme-light";
  const TRANSITION_CLASS = "theme-changing";

  let isThemeInitialized = false;
  let isThemeButtonInitialized = false;

  function getUI() {
    return window.DashboardUI || null;
  }

  function getSavedTheme() {
    let savedTheme = null;

    try {
      savedTheme = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      savedTheme = null;
    }

    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }

    return "dark";
  }

  function getCurrentTheme() {
    if (document.documentElement.classList.contains(LIGHT_CLASS)) {
      return "light";
    }

    if (document.body && document.body.classList.contains(LIGHT_CLASS)) {
      return "light";
    }

    return "dark";
  }

  function setThemeClass(theme) {
    const selectedTheme = theme === "light" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", selectedTheme);
    document.documentElement.classList.toggle(
      LIGHT_CLASS,
      selectedTheme === "light"
    );

    if (document.body) {
      document.body.setAttribute("data-theme", selectedTheme);
      document.body.classList.toggle(LIGHT_CLASS, selectedTheme === "light");
    }
  }

  function updateThemeIcon() {
    const themeIcon = document.getElementById("themeIcon");
    const themeIconHeader = document.getElementById("themeIconHeader");

    const currentTheme = getCurrentTheme();
    const iconName = currentTheme === "light" ? "light_mode" : "dark_mode";

    if (themeIcon) {
      themeIcon.textContent = iconName;
    }

    if (themeIconHeader) {
      themeIconHeader.textContent = iconName;
    }
  }

  function updateThemeButtonLabel() {
    const labels = document.querySelectorAll(
      "#themeToggleBtn .project_label, #themeToggleBtnHeader .project_label"
    );

    const currentTheme = getCurrentTheme();
    const label = currentTheme === "light" ? "Terang" : "Gelap";

    labels.forEach(function (item) {
      item.textContent = label;
    });
  }

  function updateMetaThemeColor() {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');

    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }

    const currentTheme = getCurrentTheme();

    metaThemeColor.setAttribute(
      "content",
      currentTheme === "light" ? "#f8fafc" : "#1c1c1e"
    );
  }

  function syncThemeUI() {
    updateThemeIcon();
    updateThemeButtonLabel();
    updateMetaThemeColor();
  }

  function notifyThemeChange(theme) {
    const UI = getUI();

    if (!UI || typeof UI.showToast !== "function") {
      return;
    }

    UI.showToast(
      theme === "light"
        ? "Tema terang diaktifkan."
        : "Tema gelap diaktifkan.",
      "info",
      "Informasi"
    );
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (error) {
      return;
    }
  }

  function applyTheme(theme, options) {
    const selectedTheme = theme === "light" ? "light" : "dark";

    const shouldNotify = options && options.notify === true;
    const shouldSave = !options || options.save !== false;
    const shouldAnimate = options && options.animate === true;

    if (document.body && shouldAnimate) {
      document.body.classList.add(TRANSITION_CLASS);
    }

    setThemeClass(selectedTheme);

    if (shouldSave) {
      saveTheme(selectedTheme);
    }

    syncThemeUI();

    if (document.body && shouldAnimate) {
      window.setTimeout(function () {
        document.body.classList.remove(TRANSITION_CLASS);
      }, 260);
    }

    if (shouldNotify) {
      notifyThemeChange(selectedTheme);
    }
  }

  function toggleTheme() {
    const nextTheme = getCurrentTheme() === "light" ? "dark" : "light";

    applyTheme(nextTheme, {
      save: true,
      notify: true,
      animate: true
    });
  }

  function initTheme() {
    const savedTheme = getSavedTheme();

    if (isThemeInitialized) {
      setThemeClass(savedTheme);
      syncThemeUI();
      return;
    }

    isThemeInitialized = true;

    applyTheme(savedTheme, {
      save: false,
      notify: false,
      animate: false
    });
  }

  function initThemeButtons() {
    if (isThemeButtonInitialized) {
      return;
    }

    isThemeButtonInitialized = true;

    const themeToggleBtn = document.getElementById("themeToggleBtn");
    const themeToggleBtnHeader = document.getElementById("themeToggleBtnHeader");

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener("click", toggleTheme);
    }

    if (themeToggleBtnHeader) {
      themeToggleBtnHeader.addEventListener("click", toggleTheme);
    }
  }

  function bootTheme() {
    initTheme();
    initThemeButtons();
  }

  window.DashboardTheme = {
    initTheme: initTheme,
    initThemeButtons: initThemeButtons,
    updateThemeIcon: updateThemeIcon,
    applyTheme: applyTheme,
    toggleTheme: toggleTheme,
    getCurrentTheme: getCurrentTheme
  };

  initTheme();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootTheme);
  } else {
    bootTheme();
  }
})(window, document);