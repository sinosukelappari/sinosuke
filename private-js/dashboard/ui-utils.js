(function (window, document) {
  "use strict";

  function setLoading(isLoading) {
    const submitBtn = document.getElementById("submitBtn");
    const submitSpinner = document.getElementById("submitSpinner");

    if (submitBtn) {
      submitBtn.disabled = isLoading;
    }

    if (submitSpinner) {
      submitSpinner.classList.toggle("hidden", !isLoading);
    }
  }

  function showToast(message, type = "info", title = "") {
    const container = document.getElementById("toast_container");

    if (!container) {
      return;
    }

    const titleMap = {
      success: "Berhasil",
      error: "Gagal",
      warning: "Peringatan",
      info: "Informasi"
    };

    const iconMap = {
      success: "check_circle",
      error: "error",
      warning: "warning",
      info: "info"
    };

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "assertive");

    toast.innerHTML = `
      <span class="material-symbols-rounded" aria-hidden="true">
        ${iconMap[type] || iconMap.info}
      </span>

      <div class="toast_content">
        <span class="toast_title">${title || titleMap[type] || titleMap.info}</span>
        <span class="toast_message">${message}</span>
      </div>
    `;

    container.appendChild(toast);

    setTimeout(function () {
      toast.classList.add("fade_out");

      setTimeout(function () {
        toast.remove();
      }, 260);
    }, 3500);
  }

  function clearResultMessage() {
    const messageBox = document.getElementById("formMessage");

    if (messageBox) {
      messageBox.innerHTML = "";
    }
  }

  function updateInfoKodeTambahan(option) {
    const title = document.getElementById("kodeTambahanInfoTitle");
    const text = document.getElementById("kodeTambahanInfoText");

    if (!title || !text) {
      return;
    }

    if (!option) {
      title.textContent = "Informasi Kode Tambahan";
      text.textContent =
        "Pilih kode tambahan terlebih dahulu untuk melihat keterangan klasifikasi surat.";
      return;
    }

    title.textContent = `${option.value} - ${option.label}`;
    text.textContent =
      option.description || "Belum ada keterangan untuk kode tambahan ini.";
  }

  function normalisasiTeks(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[-–—_/.,]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function formatOptionText(option) {
    return `${option.value} - ${option.label}`;
  }

  function filterOptions(options, keyword) {
    const cleanKeyword = normalisasiTeks(keyword);

    if (!cleanKeyword) {
      return options;
    }

    return options.filter(function (option) {
      const value = normalisasiTeks(option.value);
      const label = normalisasiTeks(option.label);
      const combined = normalisasiTeks(`${option.value} ${option.label}`);

      return (
        value.includes(cleanKeyword) ||
        label.includes(cleanKeyword) ||
        combined.includes(cleanKeyword)
      );
    });
  }

  function renderSearchDropdown(dropdown, options, keyword, onSelect) {
    const filteredOptions = filterOptions(options, keyword);

    dropdown.innerHTML = "";

    if (filteredOptions.length === 0) {
      dropdown.innerHTML = `
        <div class="search_empty">
          Data tidak ditemukan.
        </div>
      `;
      return;
    }

    filteredOptions.forEach(function (option) {
      const button = document.createElement("button");
      button.type = "button";

      if (option.single) {
        button.className = "search_option search_option_single";

        button.innerHTML = `
          <span class="search_option_code">${option.value}</span>
        `;
      } else {
        button.className = "search_option";

        button.innerHTML = `
          <span class="search_option_code">${option.value}</span>
          <span class="search_option_label">${option.label}</span>
        `;
      }

      button.addEventListener("click", function () {
        onSelect(option);
      });

      dropdown.appendChild(button);
    });
  }

  function closeAllSearchDropdowns() {
    const dropdowns = document.querySelectorAll(".search_dropdown");

    dropdowns.forEach(function (dropdown) {
      dropdown.classList.add("hidden");
    });
  }

  async function salinKeClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    document.execCommand("copy");
    textarea.remove();
  }

  window.DashboardUI = {
    setLoading: setLoading,
    showToast: showToast,
    clearResultMessage: clearResultMessage,
    updateInfoKodeTambahan: updateInfoKodeTambahan,
    normalisasiTeks: normalisasiTeks,
    formatOptionText: formatOptionText,
    filterOptions: filterOptions,
    renderSearchDropdown: renderSearchDropdown,
    closeAllSearchDropdowns: closeAllSearchDropdowns,
    salinKeClipboard: salinKeClipboard
  };
})(window, document);