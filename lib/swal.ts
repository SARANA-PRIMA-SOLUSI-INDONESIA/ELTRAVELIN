"use client";

import Swal from "sweetalert2";

export interface SwalConfirmOptions {
  title?: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export interface SwalAlertOptions {
  title?: string;
  text?: string;
}

/**
 * SweetAlert2 wrapper — menggantikan window.alert / window.confirm browser.
 * Semua styling disesuaikan dengan design tokens aplikasi.
 */
const baseConfig = {
  confirmButtonColor: "#0f1f3d", // navy-deep
  cancelButtonColor: "#e5e7eb",
  confirmButtonText: "Ya",
  cancelButtonText: "Batal",
  reverseButtons: true,
  customClass: {
    title: "text-lg font-display font-bold text-navy-deep",
    htmlContainer: "text-sm text-foreground/60",
    confirmButton: "!rounded-xl !px-5 !py-2.5 !text-sm !font-bold",
    cancelButton: "!rounded-xl !px-5 !py-2.5 !text-sm !font-bold !text-navy-deep",
    popup: "!rounded-3xl !shadow-2xl",
  },
} as const;

/** Konfirmasi aksi (menggantikan window.confirm). Return Promise<boolean>. */
export async function confirmAction(options: SwalConfirmOptions): Promise<boolean> {
  const result = await Swal.fire({
    icon: options.danger ? "warning" : "question",
    title: options.title || "Apakah Anda yakin?",
    text: options.text,
    showCancelButton: true,
    confirmButtonText: options.confirmText || baseConfig.confirmButtonText,
    cancelButtonText: options.cancelText || baseConfig.cancelButtonText,
    confirmButtonColor: options.danger ? "#ef4444" : baseConfig.confirmButtonColor,
    reverseButtons: true,
    customClass: baseConfig.customClass,
  });
  return result.isConfirmed;
}

/** Notifikasi sukses (menggantikan alert success). */
export async function showSuccess(options: SwalAlertOptions) {
  await Swal.fire({
    icon: "success",
    title: options.title || "Berhasil",
    text: options.text,
    confirmButtonText: "OK",
    customClass: baseConfig.customClass,
  });
}

/** Notifikasi error (menggantikan alert error). */
export async function showError(options: SwalAlertOptions) {
  await Swal.fire({
    icon: "error",
    title: options.title || "Terjadi Kesalahan",
    text: options.text,
    confirmButtonText: "OK",
    confirmButtonColor: baseConfig.confirmButtonColor,
    customClass: baseConfig.customClass,
  });
}

/** Notifikasi info. */
export async function showInfo(options: SwalAlertOptions) {
  await Swal.fire({
    icon: "info",
    title: options.title || "Info",
    text: options.text,
    confirmButtonText: "OK",
    customClass: baseConfig.customClass,
  });
}
