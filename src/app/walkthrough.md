# Walkthrough: Pemisahan Menu Data Karyawan & Data Admin

Daftar akun pengguna pada dashboard Admin telah dipisahkan menjadi dua tab menu mandiri: **Data Karyawan** dan **Data Admin** untuk meningkatkan keterbacaan dan keamanan data.

---

## 🛠️ Perubahan & Penambahan Kode

### 1. Pemisahan Tab Menu Baru
- **[admin/page.tsx](file:///C:/Users/POLARINDO/.gemini/antigravity/scratch/asik-app/src/app/admin/page.tsx) (Diperbarui)**:
  - **Tab `👥 Data Karyawan`**: Diperbarui agar hanya memproses dan menampilkan data karyawan dengan `role === "KARYAWAN"`. Tombol tambahnya juga akan otomatis men-set default role menjadi Karyawan.
  - **Tab `🛡️ Data Admin` (Baru)**: Tab khusus baru untuk menampilkan data administrator dengan `role === "ADMIN"`. Menyediakan tombol "Tambah Admin" yang otomatis men-set default role menjadi Admin.

### 2. Fitur Proteksi Penghapusan Akun Sendiri
- **Keamanan Akun Aktif**:
  - Mengambil data profil login admin aktif melalui `/api/auth/me` dan menyimpannya di state `currentUser`.
  - Pada tabel Data Admin, tombol **`Hapus`** otomatis disembunyikan untuk akun admin yang sedang login (`emp.nik !== currentUser.nik`). Hal ini mencegah Admin yang aktif agar tidak secara tidak sengaja menghapus akunnya sendiri yang dapat menyebabkan kehilangan hak akses sistem.

---

## 🧪 Cara Melakukan Verifikasi Uji Coba

1. **Buka Dashboard Admin**:
   * Buka browser dan login sebagai Admin.
2. **Lihat Menu Tab**:
   * Di dashboard utama, Anda kini akan melihat **4 tab**:
     1. `Pengajuan Cuti`
     2. `Data Karyawan` (Hanya berisi staff non-admin)
     3. `Data Admin` (Hanya berisi jajaran admin/HR)
     4. `Log Login`
3. **Uji Coba Proteksi**:
   * Masuk ke tab **Data Admin**.
   * Pada baris nama Anda (Admin yang sedang login), tombol **Hapus** tidak akan muncul, sedangkan pada akun admin lain tombol Hapus tetap tersedia (jika ada lebih dari 1 admin).

---

## 🚀 Cara Menerapkan Perubahan Ini ke GitHub & Vercel

Jalankan perintah ini di **Command Prompt (CMD)** lokal Anda untuk mengunggah semua file baru dan memicu deploy ulang otomatis di Vercel:

```cmd
git add src/app/admin/page.tsx
git commit -m "feat: pisahkan tab data karyawan dan data admin di dashboard beserta proteksi hapus diri sendiri"
git push origin main
```
Setelah di-push, Vercel akan otomatis melakukan deploy ulang, dan pemisahan menu karyawan & admin ini langsung aktif secara online!
