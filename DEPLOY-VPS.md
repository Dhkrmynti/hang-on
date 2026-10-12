# Deploy Heirloom ($HEIR) ke VPS

Untuk orang yang punya akses SSH ke VPS. Cukup 3 perintah. Skrip ini **hanya menambah**:
1 situs nginx untuk `heirlooms.fun` dan 1 proses pm2 (`heirlooms-engine`, port 5041).
Situs dan aplikasi lain yang sudah ada di server **tidak diubah**.

## 1. Masuk ke VPS lalu ambil kodenya

```sh
ssh root@202.155.13.133
apt-get install -y git
git clone -b lore-banker https://github.com/JelasBeres/robin-heist.git /opt/heirlooms
```

Repo ini private: GitHub akan meminta username dan **token** (bukan password).
Pemilik repo bisa mengundang kamu sebagai collaborator dulu.

## 2. Pasang

```sh
cd /opt/heirlooms
sh scripts/install-server.sh
```

Skrip ini memasang Node 20, nginx, pm2, dan certbot (hanya yang belum ada), lalu membangun situsnya,
membuat `.env` engine, mendaftarkan situs nginx `heirlooms.fun`, dan menjalankan engine.
Kalau RPC Robinhood diblokir DNS Indonesia, DNS server otomatis dipindah ke DNS-over-TLS (Cloudflare/Google).

Skrip berhenti sendiri tanpa mengubah apa pun kalau port 80 dipakai aplikasi selain nginx,
atau port 5041 sudah dipakai. Untuk port lain: `PORT=5051 sh scripts/install-server.sh`.

## 3. Arahkan domain, lalu HTTPS

Di DNS heirlooms.fun buat:

| Type | Name | Value |
|---|---|---|
| A | @ | 202.155.13.133 |
| A | www | 202.155.13.133 |

Tunggu beberapa menit sampai `ping heirlooms.fun` menunjuk ke IP itu, lalu:

```sh
cd /opt/heirlooms && sh scripts/install-server.sh https
```

## Update berikutnya

```sh
cd /opt/heirlooms && git pull && sh scripts/install-server.sh update
```

## Setelah token launch di Pons

Buka `https://heirlooms.fun/lotnok`, isi CA token, private key wallet creator, alamat treasury, dan **ADMIN_SECRET** (setiap simpan wajib pakai secret).
`ADMIN_SECRET` ada di `/opt/heirlooms/.env`; jangan dibagikan.
Cek engine: `pm2 logs heirlooms-engine`.
