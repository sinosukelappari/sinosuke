(function (window, document) {
  "use strict";

  const DashboardConfig = window.DashboardConfig;
  const UI = window.DashboardUI;
  const SuratAPI = window.DashboardSuratAPI;

  if (!DashboardConfig) {
    console.error("DashboardConfig belum tersedia.");
    return;
  }

  if (!UI) {
    console.error("DashboardUI belum tersedia.");
    return;
  }

  if (!SuratAPI) {
    console.error("DashboardSuratAPI belum tersedia.");
    return;
  }

  const CONFIG = DashboardConfig.CONFIG;
  const state = DashboardConfig.state;
  const klasifikasiOptions = DashboardConfig.klasifikasiOptions;

  async function isiDropdownBagianManual() {
    try {
      const response = await fetch("/api/surat/bagian");
      const result = await response.json();

      if (result.status !== "success" || !Array.isArray(result.data)) {
        state.setBagianOptions([]);
        return;
      }

      const bagianOptions = result.data.map(function (item) {
        return {
          value: item,
          label: item,
          single: true
        };
      });

      state.setBagianOptions(bagianOptions);
    } catch (error) {
      console.error("Gagal mengambil data bagian:", error);
      state.setBagianOptions([]);
    }
  }

  function aktifkanTombolAutoBagian() {
    const tombol = document.getElementById("autoBagianBtn");
    const dariBagianHidden = document.getElementById("dariBagian");
    const dariBagianSearch = document.getElementById("dariBagianSearch");
    const bagianAkun = CONFIG.userBagian || "";

    if (!tombol || !dariBagianHidden || !dariBagianSearch) {
      return;
    }

    tombol.addEventListener("click", function () {
      if (!bagianAkun) {
        UI.showToast("Bagian akun belum diatur oleh admin.", "warning");
        return;
      }

      dariBagianHidden.value = bagianAkun;
      dariBagianSearch.value = bagianAkun;

      UI.closeAllSearchDropdowns();

      UI.showToast(
        `Bagian otomatis dipilih dari akun: <b>${bagianAkun}</b>.`,
        "info"
      );
    });
  }

  function resetKodeTambahan() {
    const hiddenInput = document.getElementById("kodeTambahan");
    const searchInput = document.getElementById("kodeTambahanSearch");
    const toggleBtn = document.getElementById("kodeTambahanToggle");
    const dropdown = document.getElementById("kodeTambahanDropdown");

    state.setKodeTambahanOptions([]);

    if (hiddenInput) {
      hiddenInput.value = "";
    }

    if (searchInput) {
      searchInput.value = "";
      searchInput.placeholder = "Pilih kode klasifikasi dulu";
      searchInput.disabled = true;
    }

    if (toggleBtn) {
      toggleBtn.disabled = true;
    }

    if (dropdown) {
      dropdown.innerHTML = "";
      dropdown.classList.add("hidden");
    }

    UI.updateInfoKodeTambahan(null);
  }

  async function tampilkanKodeTambahan(kodeUtama) {
    const hiddenInput = document.getElementById("kodeTambahan");
    const searchInput = document.getElementById("kodeTambahanSearch");
    const toggleBtn = document.getElementById("kodeTambahanToggle");
    const dropdown = document.getElementById("kodeTambahanDropdown");

    if (!hiddenInput || !searchInput || !toggleBtn || !dropdown) {
      console.error("Elemen kode tambahan tidak lengkap.");
      return;
    }

    hiddenInput.value = "";
    searchInput.value = "";
    dropdown.innerHTML = "";
    dropdown.classList.add("hidden");

    if (!kodeUtama) {
      state.setKodeTambahanOptions([]);

      searchInput.placeholder = "Kode tambahan belum tersedia";
      searchInput.disabled = true;
      toggleBtn.disabled = true;

      UI.updateInfoKodeTambahan(null);
      return;
    }

    try {
      searchInput.placeholder = "Mengambil kode tambahan...";
      searchInput.disabled = true;
      toggleBtn.disabled = true;

      const response = await fetch(
        `/api/surat/kode-tambahan/${encodeURIComponent(kodeUtama)}`
      );

      const result = await response.json();

      if (result.status !== "success" || !Array.isArray(result.data)) {
        state.setKodeTambahanOptions([]);

        searchInput.placeholder = "Kode tambahan belum tersedia";
        searchInput.disabled = true;
        toggleBtn.disabled = true;

        UI.updateInfoKodeTambahan(null);
        return;
      }

      const kodeTambahanOptions = result.data.map(function (item) {
        return {
          value: item[0],
          label: item[1],
          description: item[2] || ""
        };
      });

      state.setKodeTambahanOptions(kodeTambahanOptions);

      if (kodeTambahanOptions.length === 0) {
        searchInput.placeholder = "Kode tambahan belum tersedia";
        searchInput.disabled = true;
        toggleBtn.disabled = true;

        UI.updateInfoKodeTambahan(null);
        return;
      }

      searchInput.disabled = false;
      toggleBtn.disabled = false;
      searchInput.placeholder = "Cari atau pilih kode tambahan";

      UI.renderSearchDropdown(
        dropdown,
        state.getKodeTambahanOptions(),
        "",
        function (option) {
          hiddenInput.value = option.value;
          searchInput.value = UI.formatOptionText(option);

          UI.updateInfoKodeTambahan(option);
          UI.closeAllSearchDropdowns();
        }
      );

      dropdown.classList.remove("hidden");
    } catch (error) {
      console.error("Gagal mengambil kode tambahan:", error);

      state.setKodeTambahanOptions([]);

      searchInput.placeholder = "Gagal mengambil kode tambahan";
      searchInput.disabled = true;
      toggleBtn.disabled = true;

      UI.updateInfoKodeTambahan(null);
    }
  }

  function initSearchableKodeKlasifikasi() {
    const hiddenInput = document.getElementById("kodeKlasifikasi");
    const searchInput = document.getElementById("kodeKlasifikasiSearch");
    const clearBtn = document.getElementById("kodeKlasifikasiToggle");
    const dropdown = document.getElementById("kodeKlasifikasiDropdown");

    if (!hiddenInput || !searchInput || !clearBtn || !dropdown) {
      return;
    }

    async function pilihKodeKlasifikasi(option) {
      hiddenInput.value = option.value;
      searchInput.value = UI.formatOptionText(option);

      UI.closeAllSearchDropdowns();
      UI.clearResultMessage();

      await tampilkanKodeTambahan(option.value);

      const noUrutInput = document.getElementById("noUrut");
      const nomorSuratInput = document.getElementById("nomorSurat");

      if (noUrutInput) {
        noUrutInput.value = "";
      }

      if (nomorSuratInput) {
        nomorSuratInput.value = "";
        nomorSuratInput.placeholder = "Nomor akan digenerate saat submit";
      }
    }

    function bukaDropdown() {
      UI.closeAllSearchDropdowns();

      UI.renderSearchDropdown(
        dropdown,
        klasifikasiOptions,
        searchInput.value,
        pilihKodeKlasifikasi
      );

      dropdown.classList.remove("hidden");
    }

    function clearKodeKlasifikasi() {
      hiddenInput.value = "";
      searchInput.value = "";

      const noUrutInput = document.getElementById("noUrut");
      const nomorSuratInput = document.getElementById("nomorSurat");

      if (noUrutInput) {
        noUrutInput.value = "";
      }

      if (nomorSuratInput) {
        nomorSuratInput.value = "";
        nomorSuratInput.placeholder = "Pilih kode klasifikasi dahulu";
      }

      resetKodeTambahan();
      UI.clearResultMessage();

      UI.renderSearchDropdown(
        dropdown,
        klasifikasiOptions,
        "",
        pilihKodeKlasifikasi
      );

      dropdown.classList.remove("hidden");
      searchInput.focus();
    }

    searchInput.addEventListener("focus", bukaDropdown);
    searchInput.addEventListener("click", bukaDropdown);

    searchInput.addEventListener("input", function () {
      hiddenInput.value = "";

      resetKodeTambahan();
      UI.clearResultMessage();

      UI.renderSearchDropdown(
        dropdown,
        klasifikasiOptions,
        searchInput.value,
        pilihKodeKlasifikasi
      );

      dropdown.classList.remove("hidden");
    });

    clearBtn.addEventListener("click", clearKodeKlasifikasi);

    searchInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();

        const filtered = UI.filterOptions(
          klasifikasiOptions,
          searchInput.value
        );

        if (filtered.length > 0) {
          pilihKodeKlasifikasi(filtered[0]);
        }
      }

      if (event.key === "Escape") {
        dropdown.classList.add("hidden");
      }
    });
  }

  function initSearchableKodeTambahan() {
    const hiddenInput = document.getElementById("kodeTambahan");
    const searchInput = document.getElementById("kodeTambahanSearch");
    const clearBtn = document.getElementById("kodeTambahanToggle");
    const dropdown = document.getElementById("kodeTambahanDropdown");

    if (!hiddenInput || !searchInput || !clearBtn || !dropdown) {
      return;
    }

    function pilihKodeTambahan(option) {
      hiddenInput.value = option.value;
      searchInput.value = UI.formatOptionText(option);

      UI.updateInfoKodeTambahan(option);
      UI.closeAllSearchDropdowns();
    }

    function bukaDropdown() {
      if (searchInput.disabled) {
        UI.showToast("Pilih kode klasifikasi utama terlebih dahulu.", "warning");
        return;
      }

      UI.closeAllSearchDropdowns();

      UI.renderSearchDropdown(
        dropdown,
        state.getKodeTambahanOptions(),
        searchInput.value,
        pilihKodeTambahan
      );

      dropdown.classList.remove("hidden");
    }

    function clearKodeTambahan() {
      if (searchInput.disabled) {
        return;
      }

      hiddenInput.value = "";
      searchInput.value = "";

      UI.updateInfoKodeTambahan(null);

      UI.renderSearchDropdown(
        dropdown,
        state.getKodeTambahanOptions(),
        "",
        pilihKodeTambahan
      );

      dropdown.classList.remove("hidden");
      searchInput.focus();
    }

    searchInput.addEventListener("focus", bukaDropdown);
    searchInput.addEventListener("click", bukaDropdown);

    searchInput.addEventListener("input", function () {
      hiddenInput.value = "";
      UI.updateInfoKodeTambahan(null);

      UI.renderSearchDropdown(
        dropdown,
        state.getKodeTambahanOptions(),
        searchInput.value,
        pilihKodeTambahan
      );

      dropdown.classList.remove("hidden");
    });

    clearBtn.addEventListener("click", clearKodeTambahan);

    searchInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();

        const filtered = UI.filterOptions(
          state.getKodeTambahanOptions(),
          searchInput.value
        );

        if (filtered.length > 0) {
          pilihKodeTambahan(filtered[0]);
        }
      }

      if (event.key === "Escape") {
        dropdown.classList.add("hidden");
      }
    });
  }

  function initSearchableDariBagian() {
    const hiddenInput = document.getElementById("dariBagian");
    const searchInput = document.getElementById("dariBagianSearch");
    const clearBtn = document.getElementById("dariBagianToggle");
    const dropdown = document.getElementById("dariBagianDropdown");

    if (!hiddenInput || !searchInput || !clearBtn || !dropdown) {
      return;
    }

    function pilihDariBagian(option) {
      hiddenInput.value = option.value;
      searchInput.value = option.label;

      UI.closeAllSearchDropdowns();
    }

    function bukaDropdown() {
      UI.closeAllSearchDropdowns();

      UI.renderSearchDropdown(
        dropdown,
        state.getBagianOptions(),
        searchInput.value,
        pilihDariBagian
      );

      dropdown.classList.remove("hidden");
    }

    function clearDariBagian() {
      hiddenInput.value = "";
      searchInput.value = "";

      UI.renderSearchDropdown(
        dropdown,
        state.getBagianOptions(),
        "",
        pilihDariBagian
      );

      dropdown.classList.remove("hidden");
      searchInput.focus();
    }

    searchInput.addEventListener("focus", bukaDropdown);
    searchInput.addEventListener("click", bukaDropdown);

    searchInput.addEventListener("input", function () {
      hiddenInput.value = "";

      UI.renderSearchDropdown(
        dropdown,
        state.getBagianOptions(),
        searchInput.value,
        pilihDariBagian
      );

      dropdown.classList.remove("hidden");
    });

    clearBtn.addEventListener("click", clearDariBagian);

    searchInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();

        const filtered = UI.filterOptions(
          state.getBagianOptions(),
          searchInput.value
        );

        if (filtered.length > 0) {
          pilihDariBagian(filtered[0]);
        }
      }

      if (event.key === "Escape") {
        dropdown.classList.add("hidden");
      }
    });
  }

  function initClickOutsideSearchDropdown() {
    document.addEventListener("click", function (event) {
      const isInsideSearchSelect = event.target.closest(".search_select");

      if (!isInsideSearchSelect) {
        UI.closeAllSearchDropdowns();
      }
    });
  }

  window.DashboardSearchDropdown = {
    isiDropdownBagianManual: isiDropdownBagianManual,
    aktifkanTombolAutoBagian: aktifkanTombolAutoBagian,
    resetKodeTambahan: resetKodeTambahan,
    tampilkanKodeTambahan: tampilkanKodeTambahan,
    initSearchableKodeKlasifikasi: initSearchableKodeKlasifikasi,
    initSearchableKodeTambahan: initSearchableKodeTambahan,
    initSearchableDariBagian: initSearchableDariBagian,
    initClickOutsideSearchDropdown: initClickOutsideSearchDropdown
  };
})(window, document);