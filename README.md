# Manajemen Keuangan Pribadi KoTA 101 - Server (Backend) 📊

![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

API backend yang tangguh dan modern untuk aplikasi **Manajemen Keuangan Pribadi KoTA 101**, dibangun dengan arsitektur berlapis (layered architecture) untuk skalabilitas dan kemudahan pemeliharaan. Proyek ini menyediakan semua layanan yang dibutuhkan oleh aplikasi mobile, mulai dari otentikasi pengguna hingga analisis keuangan kompleks.

---

##  Daftar Isi

- [Tentang Proyek](#tentang-proyek)
- [Tujuan Proyek](#tujuan-proyek)
- [Arsitektur & Teknologi](#arsitektur--teknologi)
- [Fitur Utama](#fitur-utama)
- [Dokumentasi API](#dokumentasi-api-swagger)
- [Instalasi & Menjalankan](#instalasi--menjalankan)
  - [Prasyarat](#prasyarat)
  - [Langkah-langkah Instalasi](#langkah-langkah-instalasi)
- [Struktur Proyek](#struktur-proyek)
- [Kontribusi](#kontribusi)
- [Lisensi](#lisensi)

## Tentang Proyek

**Manajemen Keuangan Pribadi KoTA 101** adalah tulang punggung dari aplikasi manajemen keuangan pribadi. Server ini bertanggung jawab untuk mengelola data pengguna, transaksi, perencanaan anggaran (budgeting), dan melakukan evaluasi kesehatan keuangan berdasarkan rasio-rasio finansial standar.

API ini dirancang untuk menjadi *stateless* dan aman, menggunakan JWT (JSON Web Tokens) untuk otentikasi dan otorisasi setiap permintaan yang memerlukan akses data pengguna.

## Tujuan Proyek

Proyek ini dibuat sebagai bagian dari Tugas Akhir dengan tujuan utama:

1.  **Menyediakan API Terpusat:** Membangun layanan backend yang solid untuk aplikasi mobile finance, memastikan konsistensi dan keamanan data.
2.  **Mengimplementasikan Logika Bisnis Kompleks:** Menangani perhitungan rasio keuangan, pembuatan rencana anggaran, dan validasi data di sisi server.
3.  **Integrasi dengan Layanan Eksternal:** Menyediakan endpoint untuk berinteraksi dengan model Machine Learning untuk klasifikasi deskripsi transaksi secara otomatis.
4.  **Skalabilitas:** Menggunakan Prisma ORM dan arsitektur yang terstruktur agar mudah dikembangkan di masa depan.

## Arsitektur & Teknologi

Proyek ini dibangun dengan tumpukan teknologi modern dan mengikuti prinsip-prinsip desain yang baik.

-   **Arsitektur:**
    -   **Layered Architecture**: Kode diorganisir ke dalam lapisan yang jelas: `Routes` -> `Controllers` -> `Services` -> `Repositories`.
    -   **Dependency Injection**: Menggunakan **InversifyJS** untuk mengelola dependensi antar kelas, membuat kode lebih modular dan mudah diuji.
    -   **Repository Pattern**: Memisahkan logika akses data dari logika bisnis.

-   **Teknologi Utama:**
    -   **Runtime**: Node.js
    -   **Bahasa**: TypeScript
    -   **Framework**: Express.js
    -   **Database**: PostgreSQL
    -   **ORM**: Prisma (untuk interaksi database yang aman dan modern)
    -   **Otentikasi**: JSON Web Token (JWT)
    -   **Validasi**: Zod (untuk validasi skema request body yang tangguh)
    -   **Dokumentasi API**: Swagger (OpenAPI)
    -   **Email**: Nodemailer

## Fitur Utama

-   🔐 **Manajemen Pengguna & Otentikasi**: Registrasi, Login dengan JWT, profil pengguna, dan manajemen profesi.
-   💸 **Manajemen Transaksi**: Operasi CRUD (Create, Read, Update, Delete) untuk transaksi, dilengkapi dengan filter berdasarkan tanggal, kategori, dan status bookmark.
-   📊 **Evaluasi Keuangan**: Menghitung 7 rasio keuangan penting (Likuiditas, Solvabilitas, Rasio Utang, dll.) berdasarkan data transaksi pengguna.
-   💰 **Perencanaan Anggaran (Budgeting)**: Membuat rencana anggaran bulanan, menghitung total pendapatan, dan mengalokasikan dana ke berbagai kategori pengeluaran.
-   🧠 **Klasifikasi Transaksi (ML)**: Endpoint `/transactions/classify` yang terhubung ke layanan Python untuk memprediksi kategori transaksi dari deskripsi teks.
-   🌱 **Database Seeding**: Skrip untuk mengisi database dengan data awal (kategori, profesi, rasio, pengguna contoh) untuk kemudahan development dan testing.
-   🩺 **Health Check**: Endpoint untuk memonitor status aplikasi dan koneksi database.

## Dokumentasi API (Swagger)

API ini sudah dilengkapi dengan dokumentasi interaktif menggunakan Swagger. Setelah server berjalan, Anda bisa mengaksesnya di:

<http://localhost:4000/api/v1/api-docs>

Dokumentasi ini mencakup semua endpoint yang tersedia, beserta payload yang dibutuhkan dan contoh respons.

## Instalasi & Menjalankan

Ikuti langkah-langkah berikut untuk menjalankan server ini di lingkungan lokal Anda.

### Prasyarat

-   [Node.js](https://nodejs.org/) (v18 atau lebih baru direkomendasikan)
-   [npm](https://www.npmjs.com/) atau [yarn](https://yarnpkg.com/)
-   Database [PostgreSQL](https://www.postgresql.org/download/) yang sedang berjalan.

### Langkah-langkah Instalasi

1.  **Clone Repositori**
    ```bash
    git clone https://github.com/arindama-pkmk/ta_server.git
    cd ta_server
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Setup Environment Variables**
    Buat file `.env` di root direktori proyek dan salin konten dari `.env.example` (jika ada) atau gunakan template di bawah ini. Sesuaikan nilainya dengan konfigurasi lokal Anda.

    ```env
    # URL koneksi ke database PostgreSQL Anda
    # Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
    DATABASE_URL="postgresql://postgres:password@localhost:5432/ta_database"

    # Port untuk server Express
    PORT=4000

    # Kunci rahasia untuk menandatangani JWT
    JWT_SECRET="kunci-rahasia-yang-sangat-aman"
    JWT_EXPIRATION_TIME=86400 # dalam detik (contoh: 1 hari)

    # Konfigurasi untuk hashing password
    SALT_ROUNDS=10

    # URL ke API Machine Learning Python (jika ada)
    PYTHON_ML_API_URL="http://127.0.0.1:5000"
    ML_CONFIDENCE_THRESHOLD=0.5
    ML_API_TIMEOUT_MS=5000

    # Konfigurasi email (opsional, jika fitur email digunakan)
    EMAIL_SERVICE=gmail
    EMAIL_USER=youremail@gmail.com
    EMAIL_PASS=your-app-password
    ```

4.  **Setup Database (Prisma)**
    Jalankan perintah ini untuk menerapkan migrasi skema database. Prisma akan membuat tabel-tabel yang dibutuhkan.

    ```bash
    npx prisma migrate dev --name init
    ```

5.  **Isi Data Awal (Seeding)**
    Jalankan skrip seeder untuk mengisi database dengan data awal seperti kategori, profesi, rasio, dan pengguna contoh.

    ```bash
    npx ts-node prisma/seedAll.ts
    ```

6.  **Jalankan Server**
    Server akan berjalan dalam mode development dengan auto-reload.

    ```bash
    npm run dev
    ```

✨ Server Anda sekarang berjalan di `http://localhost:4000`.

## Struktur Proyek

```
ta_server/
├── prisma/
│   ├── migrations/         # File migrasi database
│   ├── schema.prisma       # Skema utama database
│   └── seedAll.ts          # Skrip untuk seeding data
├── src/
│   ├── config/             # Konfigurasi (database, dll)
│   ├── controllers/        # Menangani request & response HTTP
│   ├── middlewares/        # Middleware (otentikasi, validasi)
│   ├── repositories/       # Logika akses data (query database)
│   ├── routes/             # Definisi endpoint API
│   ├── services/           # Logika bisnis utama aplikasi
│   ├── types/              # Definisi tipe TypeScript
│   ├── utils/              # Fungsi utilitas (logger, error handler)
│   ├── validators/         # Skema validasi (Zod)
│   └── app.ts              # Entry point aplikasi Express
├── .env                    # File environment (bukan bagian dari commit)
└── package.json            # Daftar dependencies dan skrip
```

## Kontribusi

Kontribusi, isu, dan permintaan fitur sangat diterima! Jangan ragu untuk membuka isu baru jika Anda menemukan bug atau memiliki saran.

## Lisensi

Didistribusikan di bawah Lisensi MIT. Lihat `LICENSE` untuk informasi lebih lanjut.
