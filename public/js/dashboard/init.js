(function (Core, Dashboard) {
  Dashboard.initDashboard = function () {
    const hariTanggalInput = document.getElementById("hariTanggal");
    const kodeSatkerInput = document.getElementById("kodeSatker");

    if (hariTanggalInput) {
      hariTanggalInput.value = Core.formatHariTanggal();
    }

    if (kodeSatkerInput) {
      kodeSatkerInput.value = "WP.3.PAS.4-";
    }

    Core.initTheme();
    Core.initThemeButtons();

    Dashboard.isiDropdownBagianManual();
    Dashboard.aktifkanTombolAutoBagian();

    Dashboard.resetKodeTambahan();

    Dashboard.initSearchableKodeKlasifikasi();
    Dashboard.initSearchableKodeTambahan();
    Dashboard.initSearchableDariBagian();

    Dashboard.initClickOutsideSearchDropdown();
    Dashboard.aktifkanSubmitForm();
  };

  document.addEventListener("DOMContentLoaded", function () {
    Dashboard.initDashboard();
  });
})(window.SINOSUKE, window.SINOSUKE_DASHBOARD);