(function (window, document) {
  "use strict";

  function showProfileToast(message, type, title) {
    if (
      window.DashboardUI &&
      typeof window.DashboardUI.showToast === "function"
    ) {
      window.DashboardUI.showToast(
        String(message || ""),
        type || "info",
        title || ""
      );

      return;
    }

    console.warn("DashboardUI.showToast belum tersedia:", message);
  }

  function normalizeValue(value) {
    return String(value || "")
      .trim()
      .replace(/\s+/g, " ");
  }

  function initFlashMessages() {
    const flashElement = document.getElementById("profileFlashMessagesJson");

    if (!flashElement) {
      return;
    }

    let flashMessages = {
      success: [],
      error: []
    };

    try {
      flashMessages = JSON.parse(
        flashElement.value || '{"success":[],"error":[]}'
      );
    } catch (error) {
      console.error("Gagal membaca flash message profil:", error);
      return;
    }

    if (Array.isArray(flashMessages.success)) {
      flashMessages.success.forEach(function (message) {
        showProfileToast(message, "success", "Berhasil");
      });
    }

    if (Array.isArray(flashMessages.error)) {
      flashMessages.error.forEach(function (message) {
        showProfileToast(message, "error", "Gagal");
      });
    }
  }

  function initNameFormGuard() {
    const form = document.querySelector(".profile_name_form");

    if (!form) {
      return;
    }

    const nameInput = document.getElementById("nama");
    const originalName = normalizeValue(form.dataset.originalName || "");

    form.addEventListener("submit", function (event) {
      const newName = normalizeValue(nameInput ? nameInput.value : "");

      if (!newName) {
        event.preventDefault();

        showProfileToast(
          "Nama tidak boleh kosong.",
          "error",
          "Gagal"
        );

        if (nameInput) {
          nameInput.focus();
        }

        return;
      }

      if (newName === originalName) {
        event.preventDefault();

        showProfileToast(
          "Tidak ada perubahan nama yang perlu disimpan.",
          "warning",
          "Peringatan"
        );

        if (nameInput) {
          nameInput.focus();
        }

        return;
      }

      showProfileToast(
        "Perubahan nama sedang disimpan.",
        "info",
        "Informasi"
      );
    });
  }

  function initPasswordFormGuard() {
    const form = document.querySelector(".profile_password_form");

    if (!form) {
      return;
    }

    const oldPasswordInput = document.getElementById("passwordLama");
    const newPasswordInput = document.getElementById("passwordBaru");
    const confirmPasswordInput = document.getElementById("konfirmasiPassword");

    form.addEventListener("submit", function (event) {
      const oldPassword = String(oldPasswordInput ? oldPasswordInput.value : "");
      const newPassword = String(newPasswordInput ? newPasswordInput.value : "");
      const confirmPassword = String(confirmPasswordInput ? confirmPasswordInput.value : "");

      if (!oldPassword || !newPassword || !confirmPassword) {
        event.preventDefault();

        showProfileToast(
          "Semua kolom password wajib diisi.",
          "error",
          "Gagal"
        );

        if (!oldPassword && oldPasswordInput) {
          oldPasswordInput.focus();
        } else if (!newPassword && newPasswordInput) {
          newPasswordInput.focus();
        } else if (!confirmPassword && confirmPasswordInput) {
          confirmPasswordInput.focus();
        }

        return;
      }

      if (newPassword !== confirmPassword) {
        event.preventDefault();

        showProfileToast(
          "Password baru dan konfirmasi password tidak sama.",
          "error",
          "Gagal"
        );

        if (confirmPasswordInput) {
          confirmPasswordInput.focus();
        }

        return;
      }

      if (oldPassword === newPassword) {
        event.preventDefault();

        showProfileToast(
          "Password baru tidak boleh sama dengan password lama.",
          "warning",
          "Peringatan"
        );

        if (newPasswordInput) {
          newPasswordInput.focus();
        }

        return;
      }

      showProfileToast(
        "Password baru sedang disimpan.",
        "info",
        "Informasi"
      );
    });
  }

  function init() {
    initFlashMessages();
    initNameFormGuard();
    initPasswordFormGuard();
  }

  window.ProfileUI = {
    init: init
  };
})(window, document);