(function (window, document) {
  "use strict";

  document.addEventListener("DOMContentLoaded", async function () {
    const DashboardConfig = window.DashboardConfig;
    const DashboardTheme = window.DashboardTheme;
    const SearchDropdown = window.DashboardSearchDropdown;
    const FormSubmit = window.DashboardFormSubmit;

    if (!DashboardConfig) {
      console.error("DashboardConfig belum terbaca.");
      return;
    }

    if (!DashboardTheme) {
      console.error("DashboardTheme belum terbaca.");
      return;
    }

    if (!SearchDropdown) {
      console.error("DashboardSearchDropdown belum terbaca.");
      return;
    }

    if (!FormSubmit) {
      console.error("DashboardFormSubmit belum terbaca.");
      return;
    }

    const hariTanggalInput = document.getElementById("hariTanggal");
    const kodeSatkerInput = document.getElementById("kodeSatker");

    if (hariTanggalInput) {
      hariTanggalInput.value = DashboardConfig.formatHariTanggal();
    }

    if (kodeSatkerInput) {
      kodeSatkerInput.value =
        DashboardConfig.CONFIG.kodeSatker || "WP.3.PAS.4-";
    }

    DashboardTheme.initTheme();
    DashboardTheme.initThemeButtons();

    await SearchDropdown.isiDropdownBagianManual();

    SearchDropdown.aktifkanTombolAutoBagian();
    SearchDropdown.resetKodeTambahan();

    SearchDropdown.initSearchableKodeKlasifikasi();
    SearchDropdown.initSearchableKodeTambahan();
    SearchDropdown.initSearchableDariBagian();

    SearchDropdown.initClickOutsideSearchDropdown();

    FormSubmit.aktifkanSubmitForm();
  });
})(window, document);