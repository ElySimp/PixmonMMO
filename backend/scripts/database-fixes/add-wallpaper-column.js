// Script untuk menambah kolom 'wallpaper' ke tabel UserProfile jika belum ada
const db = require('../../config/database');

async function addWallpaperColumn() {
    try {
        // Cek apakah kolom sudah ada
        const [rows] = await db.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'UserProfile' AND COLUMN_NAME = 'wallpaper'
        `);
        if (rows.length > 0) {
            console.log('Kolom wallpaper sudah ada di UserProfile.');
            process.exit(0);
        }
        // Tambahkan kolom wallpaper
        await db.query(`ALTER TABLE UserProfile ADD COLUMN wallpaper VARCHAR(255) DEFAULT NULL`);
        console.log('Kolom wallpaper berhasil ditambahkan ke UserProfile!');
        process.exit(0);
    } catch (error) {
        console.error('Gagal menambah kolom wallpaper:', error);
        process.exit(1);
    }
}

addWallpaperColumn(); 