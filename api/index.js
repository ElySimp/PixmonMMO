// api/index.js
// File ini akan bertindak sebagai entry point untuk semua permintaan API di Vercel
// dan meneruskannya ke server Express kita di direktori backend

// Import server Express dari direktori backend
const app = require('../backend/server');

// Export aplikasi sebagai handler default untuk Vercel Serverless
module.exports = app;
