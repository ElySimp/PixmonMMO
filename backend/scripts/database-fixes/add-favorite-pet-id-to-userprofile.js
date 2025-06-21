// Script untuk menambahkan kolom favorite_pet_id ke UserProfile jika belum ada
const db = require('../../config/database');

async function addFavoritePetIdColumn() {
  try {
    // Cek apakah kolom sudah ada
    const [columns] = await db.query(`SHOW COLUMNS FROM UserProfile LIKE 'favorite_pet_id'`);
    if (columns.length === 0) {
      // Tambahkan kolom
      await db.query(`ALTER TABLE UserProfile ADD COLUMN favorite_pet_id INT DEFAULT NULL`);
      console.log('Kolom favorite_pet_id berhasil ditambahkan ke UserProfile!');
    } else {
      console.log('Kolom favorite_pet_id sudah ada di UserProfile.');
    }
    process.exit(0);
  } catch (err) {
    console.error('Gagal menambahkan kolom favorite_pet_id:', err);
    process.exit(1);
  }
}

addFavoritePetIdColumn(); 