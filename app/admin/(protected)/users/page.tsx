"use client";

import { useState, useEffect } from "react";
import { getAdmins, createAdmin, updateAdmin, deleteAdmin } from "@/app/actions/admin-users";
import { AdminRole } from "@prisma/client";
import { confirmAction, showSuccess } from "@/lib/swal";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: AdminRole;
  createdAt: Date;
  updatedAt: Date;
}

const ROLE_OPTIONS: { value: AdminRole; label: string }[] = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "CS", label: "Customer Service" },
];

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  CS: "Customer Service",
};

const ROLE_BADGE_STYLES: Record<string, string> = {
  SUPER_ADMIN: "bg-navy-deep text-white",
  ADMIN: "bg-gold-soft text-navy-deep",
  CS: "bg-surface-medium text-foreground/60",
};

function getErrorMessage(err: unknown, fallback = "Terjadi kesalahan") {
  return err instanceof Error ? err.message : fallback;
}

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<AdminRole>("ADMIN");

  const fetchAdmins = async () => {
    try {
      const data = await getAdmins();
      setAdmins(data);
    } catch (err) {
      setError(getErrorMessage(err, "Gagal memuat data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const resetForm = () => {
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("ADMIN");
    setShowCreate(false);
    setEditingId(null);
    setError("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await createAdmin({ email: formEmail, password: formPassword, name: formName, role: formRole });
      resetForm();
      fetchAdmins();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setError("");
    try {
      await updateAdmin(editingId, { name: formName, password: formPassword || undefined, role: formRole });
      resetForm();
      fetchAdmins();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!(await confirmAction({ title: "Hapus Admin", danger: true, text: `Hapus admin "${email}"?` }))) return;
    setError("");
    try {
      await deleteAdmin(id);
      await showSuccess({ title: "Berhasil", text: "Admin `` berhasil dihapus." });
      fetchAdmins();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const startEdit = (admin: AdminUser) => {
    setEditingId(admin.id);
    setFormName(admin.name || "");
    setFormEmail(admin.email);
    setFormPassword("");
    setFormRole(admin.role || "ADMIN");
    setShowCreate(true);
    setError("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-navy-deep/20 border-t-navy-deep rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-display font-bold text-navy-deep">Pengguna Admin</h1>
          <p className="text-foreground/60">Kelola akun admin yang dapat mengakses panel ini.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowCreate(true); }}
          className="bg-navy-deep text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-navy-deep/90 transition-all flex items-center gap-2"
        >
          <i className="ri-add-line"></i>
          Tambah Admin
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      {showCreate && (
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-outline-ghost">
          <h3 className="font-display font-bold text-navy-deep text-lg mb-6">
            {editingId ? "Edit Admin" : "Tambah Admin Baru"}
          </h3>
          <form onSubmit={editingId ? handleUpdate : handleCreate} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-foreground/40 uppercase tracking-wider">Nama</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  placeholder="Super Admin"
                  className="px-4 py-3 rounded-xl border border-outline-ghost text-sm font-medium focus:outline-none focus:border-navy-deep"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-foreground/40 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                  disabled={!!editingId}
                  placeholder="admin@eltravel.in"
                  className="px-4 py-3 rounded-xl border border-outline-ghost text-sm font-medium focus:outline-none focus:border-navy-deep disabled:bg-surface-low disabled:text-foreground/40"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-foreground/40 uppercase tracking-wider">
                  Password {editingId ? "(kosongkan jika tidak diubah)" : ""}
                </label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  required={!editingId}
                  placeholder="Minimal 6 karakter"
                  className="px-4 py-3 rounded-xl border border-outline-ghost text-sm font-medium focus:outline-none focus:border-navy-deep"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-foreground/40 uppercase tracking-wider">Role</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as AdminRole)}
                  className="px-4 py-3 rounded-xl border border-outline-ghost text-sm font-medium focus:outline-none focus:border-navy-deep bg-white cursor-pointer"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 rounded-xl text-xs font-bold text-foreground/60 hover:bg-surface-low transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                className="bg-navy-deep text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-navy-deep/90 transition-all"
              >
                {editingId ? "Simpan Perubahan" : "Tambah Admin"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-outline-ghost overflow-hidden">
        <div className="px-8 py-4 bg-surface-low border-b border-outline-ghost">
          <span className="text-xs font-bold text-navy-deep/40 uppercase tracking-widest">
            {admins.length} Admin Terdaftar
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-low border-b border-outline-ghost">
                <th className="px-4 py-6 text-[11px] font-bold text-navy-deep uppercase tracking-wider pl-8">Nama</th>
                <th className="px-4 py-6 text-[11px] font-bold text-navy-deep uppercase tracking-wider">Email</th>
                <th className="px-4 py-6 text-[11px] font-bold text-navy-deep uppercase tracking-wider">Role</th>
                <th className="px-4 py-6 text-[11px] font-bold text-navy-deep uppercase tracking-wider">Dibuat</th>
                <th className="px-4 py-6 text-[11px] font-bold text-navy-deep uppercase tracking-wider pr-8 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-ghost">
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-sm text-foreground/40 italic">
                    Belum ada admin terdaftar.
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-surface-low/50 transition-all">
                    <td className="px-4 py-6 pl-8">
                      <span className="text-base font-bold text-navy-deep">{admin.name || "-"}</span>
                    </td>
                    <td className="px-4 py-6">
                      <span className="text-sm font-medium text-foreground/60">{admin.email}</span>
                    </td>
                    <td className="px-4 py-6">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${ROLE_BADGE_STYLES[admin.role] || "bg-surface-medium text-foreground/60"}`}>
                        {ROLE_LABELS[admin.role] || admin.role}
                      </span>
                    </td>
                    <td className="px-4 py-6">
                      <span className="text-xs font-medium text-foreground/40">
                        {new Date(admin.createdAt).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-6 pr-8 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => startEdit(admin)}
                          className="w-9 h-9 rounded-xl bg-surface-low hover:bg-navy-deep hover:text-white text-navy-deep/60 transition-all flex items-center justify-center"
                          title="Edit"
                        >
                          <i className="ri-pencil-line"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(admin.id, admin.email)}
                          className="w-9 h-9 rounded-xl bg-red-50 hover:bg-red-500 hover:text-white text-red-500 transition-all flex items-center justify-center"
                          title="Hapus"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
