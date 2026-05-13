# Bab 1: Pendahuluan

## 1.1 Pengenalan Bun JS

Bun JS adalah runtime JavaScript yang cepat dan modern yang dirancang untuk menggantikan Node.js. Dibangun dengan bahasa pemrograman Zig, Bun menawarkan performa yang superior dalam menjalankan aplikasi JavaScript dan TypeScript. Beberapa fitur utama Bun JS meliputi:

- **Kecepatan Eksekusi**: Bun menggunakan engine JavaScript yang dioptimalkan untuk kecepatan, membuatnya lebih cepat daripada Node.js dalam banyak kasus.
- **Dukungan Native untuk TypeScript**: Tidak perlu konfigurasi tambahan untuk menjalankan file TypeScript.
- **Package Manager Terintegrasi**: Bun memiliki package manager sendiri yang lebih cepat daripada npm atau yarn.
- **API yang Kompatibel**: Bun kompatibel dengan API Node.js, sehingga memudahkan migrasi dari proyek Node.js yang ada.

Dalam proyek ini, Bun JS digunakan sebagai runtime utama untuk menjalankan aplikasi backend RBAC (Role-Based Access Control).

## 1.2 Prisma ORM Versi 6 dengan MySQL

Prisma adalah Object-Relational Mapping (ORM) modern untuk Node.js dan TypeScript yang menyederhanakan interaksi dengan database. Versi 6 Prisma membawa peningkatan signifikan dalam performa dan fitur. Dalam proyek ini, kita menggunakan Prisma dengan database MySQL.

### Fitur Utama Prisma v6:
- **Schema-Driven Development**: Mendefinisikan skema database menggunakan bahasa Prisma Schema Language (PSL).
- **Type Safety**: Menghasilkan tipe TypeScript secara otomatis dari skema database.
- **Migration Tools**: Alat untuk mengelola perubahan skema database.
- **Query Builder**: API yang intuitif untuk membuat query database.

### Integrasi dengan MySQL:
MySQL adalah sistem manajemen basis data relasional open-source yang populer. Kombinasi Prisma v6 dengan MySQL memberikan:
- **Performa Tinggi**: MySQL dikenal dengan kecepatan dan skalabilitasnya.
- **Keamanan Data**: Fitur keamanan built-in untuk melindungi data sensitif.
- **Kompatibilitas**: Prisma v6 sepenuhnya mendukung MySQL sebagai database backend.

## 1.3 Konsep Role-Based Access Control (RBAC)

Role-Based Access Control (RBAC) adalah model keamanan yang mengatur akses pengguna berdasarkan peran (role) yang diberikan kepada mereka. Dalam sistem RBAC, akses ke sumber daya ditentukan oleh peran pengguna, bukan secara individual.

### Komponen Utama RBAC:
1. **Users (Pengguna)**: Individu yang menggunakan sistem.
2. **Roles (Peran)**: Kumpulan izin yang dapat diberikan kepada pengguna.
3. **Permissions (Izin)**: Hak akses spesifik untuk melakukan tindakan tertentu pada sumber daya.
4. **Resources (Sumber Daya)**: Objek atau fungsi yang dilindungi dalam sistem.

### Prinsip Kerja RBAC:
- Setiap pengguna diberikan satu atau lebih peran.
- Setiap peran memiliki kumpulan izin tertentu.
- Akses ke sumber daya ditentukan berdasarkan izin yang dimiliki peran pengguna.

### Keuntungan RBAC:
- **Manajemen Akses yang Efisien**: Mudah mengelola akses untuk grup pengguna.
- **Prinsip Least Privilege**: Pengguna hanya mendapatkan akses yang diperlukan.
- **Audit dan Compliance**: Memudahkan pelacakan dan audit akses.
- **Skalabilitas**: Mudah menambah atau mengubah peran dan izin seiring pertumbuhan sistem.

Dalam implementasi proyek ini, sistem RBAC akan menggunakan Bun JS sebagai runtime, Prisma v6 dengan MySQL sebagai penyimpanan data, dan arsitektur clean architecture untuk memisahkan logika bisnis dari infrastruktur.