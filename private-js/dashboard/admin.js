(function (window, document) {
  "use strict";

  const AdminDashboard = {};

const state = {
  bagianOptions: [],
  subAdminBagianOptions: [],
  userOptions: [],
  flashMessages: {
    success: [],
    error: []
  },
  confirmModal: null,
  pendingConfirmForm: null
};

  function ui() {
    return window.DashboardUI || null;
  }

  function toast(message, type, title) {
    const UI = ui();

    if (UI && typeof UI.showToast === "function") {
      UI.showToast(
        String(message || ""),
        type || "info",
        title || ""
      );

      return;
    }

    console.warn("DashboardUI.showToast tidak tersedia:", message);
  }

  function escapeHTML(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeValue(value) {
    return String(value || "").trim();
  }

  function parseJsonTextarea(id, fallbackValue) {
    const element = document.getElementById(id);

    if (!element) {
      return fallbackValue;
    }

    try {
      return JSON.parse(element.value || JSON.stringify(fallbackValue));
    } catch (error) {
      console.error("Gagal membaca JSON:", id, error);
      return fallbackValue;
    }
  }

function initGlobalData() {
  state.flashMessages = parseJsonTextarea("adminFlashMessagesJson", {
    success: [],
    error: []
  });

  state.bagianOptions = parseJsonTextarea("adminBagianOptionsJson", []);

  state.subAdminBagianOptions = parseJsonTextarea(
    "adminSubAdminBagianOptionsJson",
    []
  );

  if (!Array.isArray(state.subAdminBagianOptions) || state.subAdminBagianOptions.length === 0) {
    state.subAdminBagianOptions = state.bagianOptions.map(function (option) {
      return {
        nama: option.nama,
        ignoreSlot: true,
        supervisorOnly: true,
        label: "Dibawahi",
        description: "Bagian ini dibawahi sub admin dan tidak mengurangi slot user."
      };
    });
  }

  state.userOptions = parseJsonTextarea("adminUserOptionsJson", []);

  window.ADMIN_FLASH_MESSAGES = state.flashMessages;
  window.ADMIN_BAGIAN_OPTIONS = state.bagianOptions;
  window.ADMIN_SUB_ADMIN_BAGIAN_OPTIONS = state.subAdminBagianOptions;
  window.ADMIN_USER_OPTIONS = state.userOptions;
}

  function initTheme() {
    if (!window.DashboardTheme) {
      console.error("DashboardTheme tidak ditemukan. Pastikan theme.js sudah diload.");
      return;
    }

    if (typeof window.DashboardTheme.initTheme === "function") {
      window.DashboardTheme.initTheme();
    }

    if (typeof window.DashboardTheme.initThemeButtons === "function") {
      window.DashboardTheme.initThemeButtons();
    }
  }

  function initFlashMessages() {
    const flashMessages = state.flashMessages || {
      success: [],
      error: []
    };

    if (Array.isArray(flashMessages.success)) {
      flashMessages.success.forEach(function (message) {
        toast(message, "success", "Berhasil");
      });
    }

    if (Array.isArray(flashMessages.error)) {
      flashMessages.error.forEach(function (message) {
        toast(message, "error", "Gagal");
      });
    }
  }

  function initConfirmModal() {
    const confirmModalElement = document.getElementById("adminConfirmModal");
    const confirmYesBtn = document.getElementById("adminConfirmYesBtn");

    if (confirmModalElement && window.bootstrap) {
      state.confirmModal = new window.bootstrap.Modal(confirmModalElement);
    }

    document.querySelectorAll(".confirm_form").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        if (form.dataset.confirmed === "true") {
          return;
        }

        event.preventDefault();

        const title = form.dataset.confirmTitle || "Konfirmasi";
        const message = form.dataset.confirmMessage || "Apakah Anda yakin ingin melanjutkan?";
        const yesText = form.dataset.confirmYes || "Ya";
        const type = form.dataset.confirmType || "default";

        state.pendingConfirmForm = form;

        if (!state.confirmModal) {
          const confirmed = window.confirm(message);

          if (confirmed) {
            form.dataset.confirmed = "true";
            form.submit();
          }

          return;
        }

        updateConfirmModal(title, message, yesText, type);
        state.confirmModal.show();
      });
    });

    if (confirmYesBtn) {
      confirmYesBtn.addEventListener("click", function () {
        if (!state.pendingConfirmForm) {
          return;
        }

        state.pendingConfirmForm.dataset.confirmed = "true";
        state.pendingConfirmForm.submit();
      });
    }
  }

  function updateConfirmModal(title, message, yesText, type) {
    const confirmTitle = document.getElementById("adminConfirmModalLabel");
    const confirmMessage = document.getElementById("adminConfirmMessage");
    const confirmYesBtn = document.getElementById("adminConfirmYesBtn");
    const confirmIcon = document.getElementById("adminConfirmIcon");

    if (confirmTitle) {
      confirmTitle.textContent = title;
    }

    if (confirmMessage) {
      confirmMessage.textContent = message;
    }

    if (confirmYesBtn) {
      confirmYesBtn.textContent = yesText;
      confirmYesBtn.classList.remove("danger", "warning");

      if (type === "danger") {
        confirmYesBtn.classList.add("danger");
      }

      if (type === "warning") {
        confirmYesBtn.classList.add("warning");
      }
    }

    if (!confirmIcon) {
      return;
    }

    confirmIcon.classList.remove("danger", "warning");

    const iconSpan = confirmIcon.querySelector(".material-symbols-rounded");

    if (type === "danger") {
      confirmIcon.classList.add("danger");

      if (iconSpan) {
        iconSpan.textContent = "delete";
      }

      return;
    }

    if (type === "warning") {
      confirmIcon.classList.add("warning");

      if (iconSpan) {
        iconSpan.textContent = "lock_reset";
      }

      return;
    }

    if (iconSpan) {
      iconSpan.textContent = "help";
    }
  }

 function getOptionStatus(option, currentValue) {
  if (option.ignoreSlot === true || option.supervisorOnly === true) {
    return {
      isFull: false,
      label: option.label || "Dibawahi",
      description:
        option.description ||
        "Bagian ini dibawahi sub admin dan tidak mengurangi slot user."
    };
  }

  const isCurrent = String(option.nama || "") === String(currentValue || "");

  if (option.isUnlimited) {
    return {
      isFull: false,
      label: "Unlimited",
      description: "Unlimited · Terpakai " + (option.usedCount || 0) + " user"
    };
  }

  const limitUser = Number(option.limitUser || 0);
  const usedCount = Number(option.usedCount || 0);
  const remaining = Math.max(limitUser - usedCount, 0);
  const isFull = usedCount >= limitUser && !isCurrent;

  if (isFull) {
    return {
      isFull: true,
      label: "Penuh",
      description: "Penuh · Limit " + limitUser + " user"
    };
  }

  if (isCurrent && usedCount >= limitUser) {
    return {
      isFull: false,
      label: "Saat ini",
      description: "Bagian user saat ini · Limit " + limitUser + " user"
    };
  }

  return {
    isFull: false,
    label: "Sisa " + remaining,
    description: "Sisa " + remaining + " slot · Terpakai " + usedCount + "/" + limitUser + " user"
  };
}

  function renderBagianDropdown(dropdown, options, keyword, currentValue, onChoose) {
    const searchKeyword = String(keyword || "").toLowerCase().trim();

    const filtered = options.filter(function (option) {
      return String(option.nama || "").toLowerCase().includes(searchKeyword);
    });

    dropdown.innerHTML = "";

    if (filtered.length === 0) {
      dropdown.innerHTML = `
        <div class="admin_dropdown_empty">
          Tidak ada bagian yang sesuai.
        </div>
      `;

      dropdown.classList.remove("hidden");
      return;
    }

    filtered.forEach(function (option) {
      const status = getOptionStatus(option, currentValue);
      const button = document.createElement("button");

      button.type = "button";
      button.className = "admin_dropdown_option" + (status.isFull ? " disabled" : "");

      button.innerHTML = `
        <span class="admin_dropdown_icon ${status.isFull ? "full" : ""}">
          <span class="material-symbols-rounded">
            ${status.isFull ? "block" : "business_center"}
          </span>
        </span>

        <span class="admin_dropdown_text">
          <strong>${escapeHTML(option.nama)}</strong>
          <small>${escapeHTML(status.description)}</small>
        </span>

        <span class="admin_dropdown_status ${status.isFull ? "full" : "available"}">
          ${escapeHTML(status.label)}
        </span>
      `;

      if (!status.isFull) {
        button.addEventListener("click", function () {
          onChoose(option);
        });
      }

      dropdown.appendChild(button);
    });

    dropdown.classList.remove("hidden");
  }

  function initAdminBagianDropdown(form) {
    const hiddenInput = form.querySelector(".admin_bagian_hidden");
    const wrapper = form.querySelector(".admin_bagian_select");
    const searchInput = form.querySelector(".admin_bagian_search_input");
    const clearBtn = form.querySelector(".admin_bagian_clear_btn");
    const dropdown = form.querySelector(".admin_bagian_dropdown");

    if (!hiddenInput || !wrapper || !searchInput || !clearBtn || !dropdown) {
      return;
    }

    const currentValue = wrapper.dataset.current || "";

    function renderDropdown(keyword) {
      renderBagianDropdown(
        dropdown,
        state.bagianOptions,
        keyword,
        currentValue,
        function (option) {
          hiddenInput.value = option.nama;
          searchInput.value = option.nama;
          dropdown.classList.add("hidden");
        }
      );
    }

    searchInput.addEventListener("focus", function () {
      renderDropdown(searchInput.value);
    });

    searchInput.addEventListener("input", function () {
      hiddenInput.value = "";
      renderDropdown(searchInput.value);
    });

    clearBtn.addEventListener("click", function () {
      hiddenInput.value = "";
      searchInput.value = "";
      searchInput.focus();
      renderDropdown("");
    });

    document.addEventListener("click", function (event) {
      if (!wrapper.contains(event.target)) {
        dropdown.classList.add("hidden");
      }
    });

    form.addEventListener("submit", function (event) {
      if (!hiddenInput.value) {
        event.preventDefault();
        toast("Pilih bagian terlebih dahulu.", "error", "Gagal");
        searchInput.focus();
      }
    });
  }

  function initSubAdminUserDropdown() {
    const hiddenInput = document.querySelector(".subadmin_user_hidden");
    const wrapper = document.querySelector(".admin_user_select");
    const searchInput = document.querySelector(".subadmin_user_search_input");
    const clearBtn = document.querySelector(".subadmin_user_clear_btn");
    const dropdown = document.querySelector(".subadmin_user_dropdown");

    if (!hiddenInput || !wrapper || !searchInput || !clearBtn || !dropdown) {
      return;
    }

    function renderDropdown(keyword) {
      const searchKeyword = String(keyword || "").toLowerCase().trim();

      const filtered = state.userOptions.filter(function (option) {
        const text = [
          option.nama,
          option.username,
          option.role,
          option.bagian,
          option.subAdminGroup
        ].join(" ").toLowerCase();

        return text.includes(searchKeyword);
      });

      dropdown.innerHTML = "";

      if (filtered.length === 0) {
        dropdown.innerHTML = `
          <div class="admin_dropdown_empty">
            Tidak ada user yang sesuai.
          </div>
        `;

        dropdown.classList.remove("hidden");
        return;
      }

      filtered.forEach(function (option) {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "admin_dropdown_option";

        const roleLabel = option.role === "sub_admin" ? "Sub Admin" : "User";

        const subtitle = [
          option.username || "-",
          roleLabel,
          option.bagian || "Belum ada bagian"
        ].join(" · ");

        button.innerHTML = `
          <span class="admin_dropdown_icon">
            <span class="material-symbols-rounded">person</span>
          </span>

          <span class="admin_dropdown_text">
            <strong>${escapeHTML(option.nama)}</strong>
            <small>${escapeHTML(subtitle)}</small>
          </span>

          <span class="admin_dropdown_status available">
            Pilih
          </span>
        `;

        button.addEventListener("click", function () {
          hiddenInput.value = option.id;
          searchInput.value = option.nama + " - " + option.username;

          if (option.role === "sub_admin" && option.subAdminGroup) {
            const subAdminGroupInput = document.getElementById("subAdminGroup");

            if (subAdminGroupInput && !subAdminGroupInput.value.trim()) {
              subAdminGroupInput.value = option.subAdminGroup;
            }
          }

          dropdown.classList.add("hidden");
        });

        dropdown.appendChild(button);
      });

      dropdown.classList.remove("hidden");
    }

    searchInput.addEventListener("focus", function () {
      renderDropdown(searchInput.value);
    });

    searchInput.addEventListener("input", function () {
      hiddenInput.value = "";
      renderDropdown(searchInput.value);
    });

    clearBtn.addEventListener("click", function () {
      hiddenInput.value = "";
      searchInput.value = "";
      searchInput.focus();
      renderDropdown("");
    });

    document.addEventListener("click", function (event) {
      if (!wrapper.contains(event.target)) {
        dropdown.classList.add("hidden");
      }
    });
  }

  function initSubAdminMultiBagianDropdown() {
    const searchInput = document.querySelector(".subadmin_bagian_search_input");
    const clearBtn = document.querySelector(".subadmin_bagian_clear_btn");
    const dropdown = document.querySelector(".subadmin_bagian_dropdown");
    const tagsContainer = document.getElementById("subAdminBagianTags");
    const hiddenContainer = document.getElementById("subAdminBagianHiddenContainer");
    const wrapper = document.querySelector(".admin_multi_bagian_select");

    if (!searchInput || !clearBtn || !dropdown || !tagsContainer || !hiddenContainer || !wrapper) {
      return;
    }

    let selectedBagian = [];

    function syncHiddenInputs() {
      hiddenContainer.innerHTML = "";

      selectedBagian.forEach(function (nama) {
        const input = document.createElement("input");

        input.type = "hidden";
        input.name = "bagianDibawahi";
        input.value = nama;

        hiddenContainer.appendChild(input);
      });
    }

    function renderTags() {
      tagsContainer.innerHTML = "";

      selectedBagian.forEach(function (nama) {
        const tag = document.createElement("span");

        tag.className = "admin_multi_tag";

        tag.innerHTML = `
          <span class="material-symbols-rounded">business_center</span>
          ${escapeHTML(nama)}
          <button type="button" title="Hapus bagian">
            <span class="material-symbols-rounded">close</span>
          </button>
        `;

        const removeButton = tag.querySelector("button");

        removeButton.addEventListener("click", function () {
          selectedBagian = selectedBagian.filter(function (item) {
            return item !== nama;
          });

          renderTags();
          syncHiddenInputs();
          renderDropdown(searchInput.value);
        });

        tagsContainer.appendChild(tag);
      });
    }

    function renderDropdown(keyword) {
const availableOptions = state.subAdminBagianOptions.filter(function (option) {
  return !selectedBagian.includes(option.nama);
});

      renderBagianDropdown(
        dropdown,
        availableOptions,
        keyword,
        "",
        function (option) {
          if (!selectedBagian.includes(option.nama)) {
            selectedBagian.push(option.nama);
          }

          searchInput.value = "";
          renderTags();
          syncHiddenInputs();
          renderDropdown("");
        }
      );
    }

    searchInput.addEventListener("focus", function () {
      renderDropdown(searchInput.value);
    });

    searchInput.addEventListener("input", function () {
      renderDropdown(searchInput.value);
    });

    clearBtn.addEventListener("click", function () {
      searchInput.value = "";
      searchInput.focus();
      renderDropdown("");
    });

    document.addEventListener("click", function (event) {
      if (!wrapper.contains(event.target)) {
        dropdown.classList.add("hidden");
      }
    });

    const form = document.querySelector(".subadmin_create_form");

    if (form) {
      form.addEventListener("submit", function (event) {
        if (selectedBagian.length === 0) {
          event.preventDefault();
          toast("Minimal pilih satu bagian yang dibawahi sub admin.", "error", "Gagal");
          searchInput.focus();
        }
      });
    }
  }

  function initSubAdminAddBagianDropdown(form) {
    const hiddenInput = form.querySelector(".subadmin_add_bagian_hidden");
    const wrapper = form.querySelector(".subadmin_add_bagian_select");
    const searchInput = form.querySelector(".subadmin_add_bagian_search_input");
    const clearBtn = form.querySelector(".subadmin_add_bagian_clear_btn");
    const dropdown = form.querySelector(".subadmin_add_bagian_dropdown");

    if (!hiddenInput || !wrapper || !searchInput || !clearBtn || !dropdown) {
      return;
    }

    let localOptions = [];

    try {
      localOptions = JSON.parse(wrapper.dataset.options || "[]");
    } catch (error) {
      localOptions = [];
      console.error("Gagal membaca option tambah bagian sub admin:", error);
    }

    localOptions = localOptions.map(function (option) {
      if (option.ignoreSlot === true || option.supervisorOnly === true) {
        return option;
      }

      return {
        nama: option.nama,
        ignoreSlot: true,
        supervisorOnly: true,
        label: "Dibawahi",
        description: "Bagian ini akan dibawahi sub admin dan tidak mengurangi slot user."
      };
    });

    function renderDropdown(keyword) {
      renderBagianDropdown(
        dropdown,
        localOptions,
        keyword,
        "",
        function (option) {
          hiddenInput.value = option.nama;
          searchInput.value = option.nama;
          dropdown.classList.add("hidden");
        }
      );
    }

    searchInput.addEventListener("focus", function () {
      renderDropdown(searchInput.value);
    });

    searchInput.addEventListener("input", function () {
      hiddenInput.value = "";
      renderDropdown(searchInput.value);
    });

    clearBtn.addEventListener("click", function () {
      hiddenInput.value = "";
      searchInput.value = "";
      searchInput.focus();
      renderDropdown("");
    });

    document.addEventListener("click", function (event) {
      if (!wrapper.contains(event.target)) {
        dropdown.classList.add("hidden");
      }
    });

    form.addEventListener("submit", function (event) {
      if (!hiddenInput.value) {
        event.preventDefault();
        toast("Pilih bagian terlebih dahulu.", "error", "Gagal");
        searchInput.focus();
      }
    });
  }

  function initAkunSearch() {
    const searchAkunInput = document.getElementById("searchAkunInput");
    const clearSearchAkunBtn = document.getElementById("clearSearchAkunBtn");
    const akunRows = Array.from(document.querySelectorAll(".akun_row"));
    const akunNoResultRow = document.getElementById("akunNoResultRow");

    function updateVisibleRowNumbers() {
      let number = 1;

      akunRows.forEach(function (row) {
        const nomorCell = row.querySelector(".akun_nomor");

        if (!row.classList.contains("hidden") && nomorCell) {
          nomorCell.textContent = number;
          number += 1;
        }
      });
    }

    function filterAkunRows() {
      const keyword = String(searchAkunInput ? searchAkunInput.value : "")
        .trim()
        .toLowerCase();

      let visibleCount = 0;

      akunRows.forEach(function (row) {
        const nama = row.dataset.nama || "";
        const username = row.dataset.username || "";

        const isMatch =
          !keyword ||
          nama.includes(keyword) ||
          username.includes(keyword);

        row.classList.toggle("hidden", !isMatch);

        if (isMatch) {
          visibleCount += 1;
        }
      });

      if (akunNoResultRow) {
        akunNoResultRow.classList.toggle("hidden", visibleCount > 0);
      }

      updateVisibleRowNumbers();
    }

    if (searchAkunInput) {
      searchAkunInput.addEventListener("input", filterAkunRows);
    }

    if (clearSearchAkunBtn) {
      clearSearchAkunBtn.addEventListener("click", function () {
        if (searchAkunInput) {
          searchAkunInput.value = "";
          searchAkunInput.focus();
        }

        filterAkunRows();
      });
    }
  }

  function initCopyNomorSurat() {
    document.querySelectorAll(".copy_nomor_btn").forEach(function (button) {
      button.addEventListener("click", async function () {
        const nomor = button.dataset.nomor || "";
        const UI = ui();

        if (!nomor) {
          toast("Nomor surat kosong.", "warning", "Peringatan");
          return;
        }

        try {
          if (UI && typeof UI.salinKeClipboard === "function") {
            await UI.salinKeClipboard(nomor);
          } else {
            await navigator.clipboard.writeText(nomor);
          }

          toast("Nomor surat berhasil disalin.", "success", "Berhasil");
        } catch (error) {
          console.error("Gagal menyalin nomor surat:", error);
          toast("Gagal menyalin nomor surat.", "error", "Gagal");
        }
      });
    });
  }

  function getFormControlValue(control) {
    if (!control) {
      return "";
    }

    return normalizeValue(control.value);
  }

  function initOriginalFormValues() {
    document
      .querySelectorAll(".admin_limit_input, .admin_bagian_hidden, #dariBagianMode, #spreadsheetUrl, #googleScriptUrl")
      .forEach(function (control) {
        const originalValue = control.dataset.originalValue;

        if (typeof originalValue === "undefined") {
          control.dataset.originalValue = getFormControlValue(control);
        }
      });
  }

  function hasConfigChanged(form) {
    const controls = Array.from(
      form.querySelectorAll("#dariBagianMode, #spreadsheetUrl, #googleScriptUrl")
    );

    return controls.some(function (control) {
      const originalValue = normalizeValue(control.dataset.originalValue);
      const currentValue = getFormControlValue(control);

      return originalValue !== currentValue;
    });
  }

  function initSmartSaveGuard() {
    initOriginalFormValues();

    document.addEventListener(
      "submit",
      function (event) {
        const form = event.target;

        if (!(form instanceof HTMLFormElement)) {
          return;
        }

        const submitter = event.submitter;
        const submitterText = submitter
          ? String(submitter.textContent || "").toLowerCase()
          : "";

        const isSaveAction =
          submitterText.includes("simpan") ||
          form.classList.contains("admin_bagian_form") ||
          Boolean(form.querySelector(".admin_limit_input")) ||
          form.getAttribute("action") === "/admin/settings";

        if (!isSaveAction) {
          return;
        }

        if (form.classList.contains("admin_bagian_form")) {
          handleBagianSmartSave(event, form);
          return;
        }

        const limitInput = form.querySelector(".admin_limit_input");

        if (limitInput) {
          handleLimitSmartSave(event, limitInput);
          return;
        }

        if (form.getAttribute("action") === "/admin/settings") {
          handleConfigSmartSave(event, form);
        }
      },
      true
    );
  }

  function handleBagianSmartSave(event, form) {
    const hiddenInput = form.querySelector(".admin_bagian_hidden");
    const wrapper = form.querySelector(".admin_bagian_select");
    const searchInput = form.querySelector(".admin_bagian_search_input");

    if (!hiddenInput || !wrapper) {
      return;
    }

    const currentValue = normalizeValue(wrapper.dataset.current || "");
    const newValue = normalizeValue(hiddenInput.value || "");

    if (!newValue) {
      return;
    }

    if (newValue === currentValue) {
      event.preventDefault();
      event.stopImmediatePropagation();

      toast("Tidak ada perubahan bagian yang perlu disimpan.", "warning", "Peringatan");

      if (searchInput) {
        searchInput.focus();
      }

      return;
    }

    toast("Perubahan bagian sedang disimpan.", "info", "Informasi");
  }

  function handleLimitSmartSave(event, limitInput) {
    const originalLimit = normalizeValue(limitInput.dataset.originalValue || "");
    const newLimit = normalizeValue(limitInput.value || "");

    if (originalLimit === newLimit) {
      event.preventDefault();
      event.stopImmediatePropagation();

      toast("Tidak ada perubahan limit user yang perlu disimpan.", "warning", "Peringatan");
      limitInput.focus();

      return;
    }

    toast("Perubahan limit user sedang disimpan.", "info", "Informasi");
  }

  function handleConfigSmartSave(event, form) {
    if (!hasConfigChanged(form)) {
      event.preventDefault();
      event.stopImmediatePropagation();

      toast("Tidak ada perubahan konfigurasi yang perlu disimpan.", "warning", "Peringatan");

      return;
    }

    toast("Konfigurasi aplikasi sedang disimpan.", "info", "Informasi");
  }

  function initDropdowns() {
    document.querySelectorAll(".admin_bagian_form").forEach(initAdminBagianDropdown);

    initSubAdminUserDropdown();
    initSubAdminMultiBagianDropdown();

    document
      .querySelectorAll(".subadmin_add_bagian_form")
      .forEach(initSubAdminAddBagianDropdown);
  }

  function init() {
    initGlobalData();
    initTheme();
    initFlashMessages();
    initConfirmModal();
    initDropdowns();
    initAkunSearch();
    initCopyNomorSurat();
    initSmartSaveGuard();
  }

  AdminDashboard.init = init;
  window.AdminDashboard = AdminDashboard;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window, document);