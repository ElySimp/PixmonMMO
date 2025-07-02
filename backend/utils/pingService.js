// pingService.js
// CATATAN: File ini tidak lagi digunakan untuk deployment di Vercel
// Script ini hanya diperlukan untuk hosting di platform seperti Render yang memiliki timeout untuk free tier

const https = require('https');
const logger = require('./logger'); // Fixed path to logger

// URL endpoint yang akan di-ping (tidak digunakan di Vercel)
let backendUrl = process.env.BACKEND_URL;

// Interval ping dalam milidetik (tidak digunakan di Vercel)
const PING_INTERVAL = 14 * 60 * 1000; // 14 menit

// Fungsi untuk melakukan ping
function pingBackend() {
  // Periksa apakah URL backend tersedia
  if (!backendUrl) {
    backendUrl = `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`;
  }
  
  if (!backendUrl) {
    console.log('Backend URL tidak dikonfigurasi. Ping service tidak aktif.');
    return;
  }

  // Kirim HTTP request ke URL backend
  const pingUrl = `${backendUrl}/api/health`;
  
  https.get(pingUrl, (res) => {
    const { statusCode } = res;
    
    if (statusCode === 200) {
      logger.debug(`Ping berhasil dengan status ${statusCode}`, 'PING');
    } else {
      logger.warning(`Ping gagal dengan status ${statusCode}`, 'PING');
    }
  }).on('error', (err) => {
    logger.error(`Ping error: ${err.message}`, 'PING');
  });
}

// Mulai interval ping
function startPingService() {
  logger.info('Memulai ping service untuk menjaga backend tetap aktif', 'PING');
  
  // Ping pertama setelah 1 menit server berjalan
  setTimeout(() => {
    pingBackend();
    
    // Set interval untuk ping berikutnya
    setInterval(pingBackend, PING_INTERVAL);
  }, 60000);
}

module.exports = { startPingService };
