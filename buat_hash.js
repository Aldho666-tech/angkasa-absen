const bcrypt = require('bcryptjs');

// --- Ganti password di sini jika Anda mau ---
const passwordPolos = 'admin123'; 
// -----------------------------------------

const saltRounds = 10;

console.log(`Membuat hash untuk password: "${passwordPolos}"`);

bcrypt.hash(passwordPolos, saltRounds, function(err, hash) {
    if (err) {
        console.error("Gagal membuat hash:", err);
        return;
    }
    console.log("\n============================================================");
    console.log("== HASH BARU ANDA (Salin semua baris di bawah ini) ==");
    console.log(hash);
    console.log("============================================================\n");
});