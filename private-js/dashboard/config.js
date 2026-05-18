(function (window) {
  "use strict";

  const CONFIG = window.DASHBOARD_CONFIG || {};

  const hariIndonesia = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu"
  ];

  const bulanIndonesia = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember"
  ];

  const klasifikasiOptions = [
    { value: "PR", label: "Perencanaan" },
    { value: "KU", label: "Keuangan" },
    { value: "OT", label: "Organisasi dan Tata Laksana" },
    { value: "SA", label: "SDM Aparatur" },
    { value: "PB", label: "Pengelolaan BMN" },
    { value: "HK", label: "Hukum dan Kerja Sama" },
    { value: "UM", label: "Umum" },
    { value: "PW", label: "Pengawasan" },
    { value: "TI", label: "Teknologi dan Informasi" },
    { value: "PK", label: "Pemasyarakatan" },
    { value: "GR", label: "Keimigrasian" },
    { value: "SM", label: "Sumber Daya Manusia" },
    { value: "LT", label: "Penelitian dan Pengembangan" }
  ];

  const namaKlasifikasi = {
    PR: "Perencanaan",
    KU: "Keuangan",
    OT: "Organisasi dan Tata Laksana",
    SA: "SDM Aparatur",
    PB: "Pengelolaan Barang Milik Negara",
    HK: "Hukum dan Kerja Sama",
    UM: "Umum",
    PW: "Pengawasan",
    TI: "Teknologi dan Informasi",
    PK: "Pemasyarakatan",
    GR: "Keimigrasian",
    SM: "Sumber Daya Manusia",
    LT: "Penelitian dan Pengembangan"
  };

  let kodeTambahanOptions = [];
  let bagianOptions = [];

  const state = {
    getKodeTambahanOptions: function () {
      return kodeTambahanOptions;
    },

    setKodeTambahanOptions: function (options) {
      kodeTambahanOptions = Array.isArray(options) ? options : [];
    },

    getBagianOptions: function () {
      return bagianOptions;
    },

    setBagianOptions: function (options) {
      bagianOptions = Array.isArray(options) ? options : [];
    }
  };

  function getNamaKlasifikasi(kode) {
    return namaKlasifikasi[kode] || kode;
  }

  function formatHariTanggal() {
    const now = new Date();
    const hari = hariIndonesia[now.getDay()];
    const tanggal = now.getDate();
    const bulan = bulanIndonesia[now.getMonth()];
    const tahun = now.getFullYear();

    return `${hari}, ${tanggal} ${bulan} ${tahun}`;
  }

  window.DashboardConfig = {
    CONFIG: CONFIG,
    hariIndonesia: hariIndonesia,
    bulanIndonesia: bulanIndonesia,
    klasifikasiOptions: klasifikasiOptions,
    namaKlasifikasi: namaKlasifikasi,
    state: state,
    getNamaKlasifikasi: getNamaKlasifikasi,
    formatHariTanggal: formatHariTanggal
  };
})(window);