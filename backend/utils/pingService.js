// pingService.js
// Script untuk menjaga backend tetap aktif dengan mengirim ping secara berkala

const https = require('https');
const logger = require('./utils/logger');

// URL endpoint yang akan di-ping
let backendUrl = process.env.BACKEND_URL;

// Interval ping dalam milidetik (15 menit)
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
