(function (window, document) {
  "use strict";

  const DashboardConfig = window.DashboardConfig;
  const UI = window.DashboardUI;
  const SuratAPI = window.DashboardSuratAPI;
  const SearchDropdown = window.DashboardSearchDropdown;

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

  if (!SearchDropdown) {
    console.error("DashboardSearchDropdown belum tersedia.");
    return;
  }

  const CONFIG = DashboardConfig.CONFIG;

  function resetFormSetelahSubmit(form) {
    form.reset();

    const hariTanggalInput = document.getElementById("hariTanggal");
    const kodeSatkerInput = document.getElementById("kodeSatker");
    const noUrutInput = document.getElementById("noUrut");
    const nomorSuratInput = document.getElementById("nomorSurat");

    const jenisSuratInput = document.getElementById("jenisSurat");

    const kodeKlasifikasiHidden = document.getElementById("kodeKlasifikasi");
    const kodeKlasifikasiSearch = document.getElementById("kodeKlasifikasiSearch");

    const dariBagianHidden = document.getElementById("dariBagian");
    const dariBagianSearch = document.getElementById("dariBagianSearch");

    if (hariTanggalInput) {
      hariTanggalInput.value = DashboardConfig.formatHariTanggal();
    }

    if (kodeSatkerInput) {
      kodeSatkerInput.value = CONFIG.kodeSatker || "WP.3.PAS.4-";
    }

if (jenisSuratInput) {
  jenisSuratInput.value = "SURAT_BIASA";
}

    if (noUrutInput) {
      noUrutInput.value = "";
    }

    if (nomorSuratInput) {
      nomorSuratInput.value = "";
      nomorSuratInput.placeholder = "Nomor akan digenerate saat submit";
    }

    if (kodeKlasifikasiHidden) {
      kodeKlasifikasiHidden.value = "";
    }

    if (kodeKlasifikasiSearch) {
      kodeKlasifikasiSearch.value = "";
    }

    if (dariBagianHidden && dariBagianSearch && !dariBagianSearch.readOnly) {
      dariBagianHidden.value = "";
      dariBagianSearch.value = "";
    }

    SearchDropdown.resetKodeTambahan();
  }

  function aktifkanSubmitForm() {
    const suratForm = document.getElementById("suratForm");

    if (!suratForm) {
      return;
    }

    suratForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const form = e.target;
      const formData = new FormData(form);

      const data = {
        hariTanggal: formData.get("hariTanggal"),
        kodeSatker: formData.get("kodeSatker"),
        jenisSurat: formData.get("jenisSurat"),
        kodeKlasifikasi: formData.get("kodeKlasifikasi"),
        kodeTambahan: formData.get("kodeTambahan"),
        dariBagian: formData.get("dariBagian"),
        tujuanSurat: formData.get("tujuanSurat"),
        halSurat: formData.get("halSurat"),
        namaUser: CONFIG.userNama || "",
        username: CONFIG.username || ""
      };

      if (!data.jenisSurat) {
        UI.showToast("Pilih jenis surat terlebih dahulu.", "warning");
        return;
      }

      if (!data.kodeKlasifikasi) {
        UI.showToast("Pilih kode klasifikasi utama terlebih dahulu.", "warning");
        return;
      }

      if (!data.kodeTambahan) {
        UI.showToast("Pilih kode tambahan terlebih dahulu.", "warning");
        return;
      }

      if (!data.dariBagian) {
        UI.showToast("Dari Bagian wajib diisi.", "warning");
        return;
      }

      if (!data.tujuanSurat) {
        UI.showToast("Tujuan Surat wajib diisi.", "warning");
        return;
      }

      if (!data.halSurat) {
        UI.showToast("Hal Surat wajib diisi.", "warning");
        return;
      }

      UI.setLoading(true);
      UI.showToast("Menyimpan data dan membuat nomor surat...", "info");

      try {
        const response = await fetch("/api/surat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.status === "success") {
          const nomorSuratLengkap = result.nomorSuratLengkap || "";

          UI.showToast(
            `Data berhasil disimpan ke sheet <b>${result.sheetName || "-"}</b>.`,
            "success"
          );

          if (result.mongoSaved === false) {
            UI.showToast(
              "Data berhasil masuk Google Sheet, tetapi gagal tersimpan ke MongoDB. Hubungi admin.",
              "warning"
            );
          }

          SuratAPI.tampilNomorSuratBerhasil(result, nomorSuratLengkap);
          SuratAPI.aktifkanCopyNomorSurat(nomorSuratLengkap);

          const noUrutInput = document.getElementById("noUrut");
          const nomorSuratInput = document.getElementById("nomorSurat");

          if (noUrutInput) {
            noUrutInput.value = result.noUrut || "";
          }

          if (nomorSuratInput) {
            nomorSuratInput.value = result.nomorSurat || "";
          }

          resetFormSetelahSubmit(form);
        } else {
          UI.showToast(result.message || "Data gagal disimpan.", "error");
        }
      } catch (error) {
        console.error(error);
        UI.showToast("Gagal terhubung ke server.", "error");
      } finally {
        UI.setLoading(false);
      }
    });
  }

  window.DashboardFormSubmit = {
    resetFormSetelahSubmit: resetFormSetelahSubmit,
    aktifkanSubmitForm: aktifkanSubmitForm
  };
})(window, document);