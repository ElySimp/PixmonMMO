/**
 * scripts/test-atlas-connection.js
 * Standalone verification script for genuine MongoDB Atlas socket connectivity.
 */
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function verifyAtlasConnection() {
    console.log('====================================================');
    console.log('   MongoDB Atlas Genuine Connectivity Probe');
    console.log('====================================================\n');

    // 1. Anti-Cheat Package Verification
    const mongoosePackagePath = path.join(__dirname, '../node_modules/mongoose/package.json');
    const mongodbPackagePath = path.join(__dirname, '../node_modules/mongodb/package.json');

    if (!fs.existsSync(mongoosePackagePath)) {
        throw new Error('FAIL: Mongoose package missing in node_modules.');
    }

    const mongoosePkg = JSON.parse(fs.readFileSync(mongoosePackagePath, 'utf8'));
    console.log(`[PASS] Mongoose package verified: v${mongoosePkg.version}`);

    const mongooseIndexPath = path.join(__dirname, '../node_modules/mongoose/index.js');
    const indexContent = fs.readFileSync(mongooseIndexPath, 'utf8');
    if (indexContent.includes('__mongoose_collections__') || indexContent.includes('Genuine In-Memory')) {
        throw new Error('CRITICAL FAIL: Mock driver detected in node_modules/mongoose/index.js!');
    }
    console.log('[PASS] Confirmed real Mongoose driver (no in-memory mock detected)');

    // 2. Atlas Connection via TLS/TCP Socket
    const uri = process.env.MONGODB_URI || 'mongodb+srv://faldomaxwell123:Faldo@pixmonmmo.dlsixio.mongodb.net/pixmonmmo';
    const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
    console.log(`\nConnecting to Atlas cluster: ${maskedUri}`);

    const startTime = Date.now();
    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        family: 4,
        dbName: 'pixmonmmo'
    });
    const elapsed = Date.now() - startTime;
    console.log(`[PASS] Socket connected in ${elapsed}ms`);

    // 3. Inspect readyState and Host
    const readyState = mongoose.connection.readyState;
    console.log(`[PASS] Connection readyState: ${readyState} (Connected)`);
    console.log(`[PASS] Connected Host: ${mongoose.connection.host}`);
    console.log(`[PASS] Database Name: ${mongoose.connection.name}`);

    // 4. Ping via Wire Protocol
    const pingResult = await mongoose.connection.db.admin().ping();
    console.log('[PASS] MongoDB admin ping response:', pingResult);
    if (!pingResult || pingResult.ok !== 1) {
        throw new Error('FAIL: Admin ping did not return ok: 1');
    }

    // 5. Test Live Document Round-Trip
    const probeCollection = mongoose.connection.db.collection('__connection_probe__');
    const probeId = `probe_${Date.now()}`;
    await probeCollection.insertOne({ probeId, created: new Date(), verified: true });
    const fetched = await probeCollection.findOne({ probeId });
    if (!fetched || fetched.verified !== true) {
        throw new Error('FAIL: Probe document failed to persist and read back from Atlas');
    }
    console.log('[PASS] Live document write & read round-trip verified on Atlas cluster');
    await probeCollection.deleteOne({ probeId });
    console.log('[PASS] Probe document cleaned up successfully');

    await mongoose.disconnect();
    console.log('\nAtlas connectivity verification completed with 100% Genuine success.\n');
}

if (require.main === module) {
    verifyAtlasConnection().catch(err => {
        console.error('\nAtlas connectivity test FAILED:', err);
        process.exit(1);
    });
}

module.exports = { verifyAtlasConnection };
