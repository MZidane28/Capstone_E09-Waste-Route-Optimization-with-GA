# 🚀 Vercel Deployment Guide

## Environment Variables Setup

Karena file `.env.local` tidak di-commit ke Git (untuk keamanan), kamu perlu **menambahkan Environment Variables secara manual di Vercel Dashboard**.

### Langkah-langkah Setup di Vercel:

1. **Buka Vercel Dashboard**
   - Go to: https://vercel.com/dashboard
   - Pilih project: `Capstone_E09-Waste-Route-Optimization-with-GA`

2. **Buka Settings**
   - Klik tab **Settings** di menu atas
   - Pilih **Environment Variables** di sidebar kiri

3. **Tambahkan Environment Variable**
   - Click button **Add New**
   - Isi form berikut:

   **Key (Name):**
   ```
   NEXT_PUBLIC_API_URL
   ```

   **Value:**
   ```
   https://e09backend-hacehnc5ctcmave2.southeastasia-01.azurewebsites.net/api/v1
   ```

   **Environments:** ✅ Check semua (Production, Preview, Development)

4. **Save dan Redeploy**
   - Klik **Save**
   - Kembali ke tab **Deployments**
   - Pada deployment terakhir, klik **⋯** (three dots) → **Redeploy**
   - Atau tunggu push berikutnya untuk trigger automatic deployment

---

## Alternative: Vercel CLI (Optional)

Jika kamu prefer menggunakan CLI:

```bash
# Install Vercel CLI (jika belum)
npm i -g vercel

# Login ke Vercel
vercel login

# Link project
cd client
vercel link

# Add environment variable
vercel env add NEXT_PUBLIC_API_URL production
# Paste: https://e09backend-hacehnc5ctcmave2.southeastasia-01.azurewebsites.net/api/v1

vercel env add NEXT_PUBLIC_API_URL preview
# Paste: https://e09backend-hacehnc5ctcmave2.southeastasia-01.azurewebsites.net/api/v1

# Trigger redeploy
vercel --prod
```

---

## Verifikasi Setup

Setelah deployment selesai:

1. **Buka production URL** (misal: https://your-app.vercel.app)

2. **Test API Connection:**
   - Buka halaman `/test-api`
   - Klik button "Get All Bins"
   - Seharusnya muncul data dari Azure backend

3. **Check Environment Variable di Browser:**
   - Buka Developer Console (F12)
   - Ketik: `console.log(process.env.NEXT_PUBLIC_API_URL)`
   - ⚠️ Di production, Next.js akan replace ini dengan actual value saat build time

---

## Troubleshooting

### ❌ API still using localhost

**Penyebab:** Environment variable belum di-set atau deployment belum trigger rebuild

**Solusi:**
1. Pastikan env var sudah ditambahkan di Vercel Dashboard
2. Trigger redeploy:
   - Option 1: Push commit baru ke GitHub
   - Option 2: Manual redeploy di Vercel Dashboard → Deployments → Redeploy

### ❌ Build failed di Vercel

**Penyebab:** ESLint errors atau missing dependencies

**Solusi:**
1. Test build locally: `npm run build` di folder `client/`
2. Fix semua ESLint errors
3. Commit dan push fix ke GitHub

### ❌ Environment variable tidak terdeteksi

**Penyebab:** Variable name salah atau tidak ada prefix `NEXT_PUBLIC_`

**Solusi:**
1. Pastikan nama variable **exact**: `NEXT_PUBLIC_API_URL`
2. Di Next.js, hanya var dengan prefix `NEXT_PUBLIC_` yang exposed ke browser
3. Re-check di Vercel Dashboard → Settings → Environment Variables

---

## Important Notes

⚠️ **NEXT_PUBLIC_API_URL** adalah environment variable yang:
- **Harus** diawali dengan `NEXT_PUBLIC_` agar bisa diakses di browser
- Di-inject saat **build time**, bukan runtime
- Setiap perubahan value **requires rebuild** (redeploy)

✅ **Best Practice:**
- Jangan commit file `.env.local` ke Git
- Gunakan `.env.example` untuk dokumentasi
- Set actual values di Vercel Dashboard atau Vercel CLI

---

## Next Steps

Setelah setup environment variable:

1. ✅ Vercel akan auto-deploy setiap push ke `main` branch
2. ✅ Frontend akan connect ke Azure backend production
3. ✅ Test semua fitur di production URL
4. ✅ Monitor di Vercel Analytics (optional)

Happy Deploying! 🎉
