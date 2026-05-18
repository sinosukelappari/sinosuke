(function (window, document) {
  "use strict";

  const DashboardConfig = window.DashboardConfig;
  const UI = window.DashboardUI;

  function buatNomorSuratLengkap(data) {
    // const tahun = new Date().getFullYear();

    return `${data.kodeSatker}${data.nomorSurat}.${data.kodeKlasifikasi}.${data.kodeTambahan}`;
  };

  async function ambilNomorOtomatis() {
    const kodeKlasifikasiInput = document.getElementById("kodeKlasifikasi");
    const noUrutInput = document.getElementById("noUrut");
    const nomorSuratInput = document.getElementById("nomorSurat");

    if (!kodeKlasifikasiInput || !noUrutInput || !nomorSuratInput) {
      return;
    }

    const kodeKlasifikasi = kodeKlasifikasiInput.value;

    noUrutInput.value = "";
    nomorSuratInput.value = "";

    if (!kodeKlasifikasi) {
      noUrutInput.placeholder = "Pilih kode klasifikasi dahulu";
      nomorSuratInput.placeholder = "Pilih kode klasifikasi dahulu";
      return;
    }

    noUrutInput.placeholder = "Mengambil nomor...";
    nomorSuratInput.placeholder = "Mengambil nomor...";

    UI.showToast("Mengambil nomor surat dari server...", "info");

    try {
      const response = await fetch(
        `/api/surat/last-number?kodeKlasifikasi=${encodeURIComponent(kodeKlasifikasi)}`
      );

      const result = await response.json();

      if (result.status === "success") {
        noUrutInput.value =
          result.nextNoUrut !== undefined ? result.nextNoUrut : "";

        nomorSuratInput.value =
          result.nextNomorSurat !== undefined ? result.nextNomorSurat : "";

        UI.showToast(
          `No. Urut dan Nomor Surat berhasil diambil dari sheet <b>${result.sheetName}</b>.`,
          "success"
        );
      } else {
        noUrutInput.placeholder = "Gagal mengambil nomor";
        nomorSuratInput.placeholder = "Gagal mengambil nomor";

        UI.showToast(result.message || "Gagal mengambil nomor surat.", "error");
      }
    } catch (error) {
      console.error(error);

      noUrutInput.placeholder = "Gagal mengambil nomor";
      nomorSuratInput.placeholder = "Gagal mengambil nomor";

      UI.showToast("Gagal mengambil nomor dari server.", "error");
    }
  }

  function tampilNomorSuratBerhasil(result, nomorSuratLengkap) {
    const messageBox = document.getElementById("formMessage");

    if (!messageBox) {
      return;
    }

    messageBox.innerHTML = `
      <div class="result_card">
        <h3>
          <span class="material-symbols-rounded">check_circle</span>
          Data Berhasil Disimpan
        </h3>

        <p>
          Data berhasil disimpan ke sheet 
          <b>${result.sheetName}</b> - 
          <b>${DashboardConfig.getNamaKlasifikasi(result.sheetName)}</b> 
          pada baris <b>${result.row}</b>.
        </p>

        <p>Nomor Surat:</p>

        <span 
          id="copyNomorSurat"
          class="copy_badge"
          title="Klik untuk copy nomor surat"
        >
          <span class="material-symbols-rounded">content_copy</span>
          ${nomorSuratLengkap}
        </span>

        <p>
          <small>Klik nomor surat untuk menyalin.</small>
        </p>
      </div>
    `;
  }

  function aktifkanCopyNomorSurat(nomorSuratLengkap) {
    setTimeout(function () {
      const copyElement = document.getElementById("copyNomorSurat");

      if (!copyElement) {
        return;
      }

      copyElement.addEventListener("click", async function () {
        try {
          await UI.salinKeClipboard(nomorSuratLengkap);

          copyElement.classList.add("copied");
          copyElement.innerHTML = `
            <span class="material-symbols-rounded">check_circle</span>
            Tersalin: ${nomorSuratLengkap}
          `;

          UI.showToast("Nomor surat berhasil disalin.", "success");
        } catch (error) {
          UI.showToast("Gagal menyalin nomor surat.", "error");
        }
      });
    }, 100);
  }

  window.DashboardSuratAPI = {
    buatNomorSuratLengkap: buatNomorSuratLengkap,
    ambilNomorOtomatis: ambilNomorOtomatis,
    tampilNomorSuratBerhasil: tampilNomorSuratBerhasil,
    aktifkanCopyNomorSurat: aktifkanCopyNomorSurat
  };
})(window, document);