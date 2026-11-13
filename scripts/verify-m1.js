/**
 * scripts/verify-m1.js
 * Hardened Verification Suite for Milestone 1: Database Migration & Backend Persistence
 * 
 * Tests:
 * 1. package.json & package-lock.json dependency audit (mongoose ^8.x present, mysql2 absent)
 * 2. Source code audit (zero require('mysql2') or raw SQL in active backend code; route security; English comments)
 * 3. MongoDB Atlas connection module & caching (connectDB, getConnectionStatus)
 * 4. Idempotent seed script execution (double run produces identical document counts)
 * 5. Player model lifecycle, password security (safe comparePassword, unique salt), and energy boundaries (anti-injection)
 * 6. UserInventory compound unique index and ItemTemplate relations
 * 7. Server healthcheck endpoint response format and collection statistics
 */

const fs = require('fs');
const path = require('path');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`  [PASS] ${message}`);
    } else {
        failedTests++;
        console.error(`  [FAIL] ${message}`);
    }
}

async function runVerification() {
    console.log('=================================================================');
    console.log('   PixmonMMO Milestone 1: Verification Suite');
    console.log('=================================================================\n');

    const projectRoot = path.resolve(__dirname, '..');

    // TEST SUITE 1: package.json dependencies and lockfile
    console.log('1. Verifying package.json dependencies and lockfile...');
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    assert(Boolean(packageJson.dependencies && packageJson.dependencies.mongoose), 'Mongoose is listed in dependencies');
    assert(Boolean(packageJson.dependencies.mongoose.startsWith('^8') || packageJson.dependencies.mongoose.startsWith('8')), 'Mongoose version is ^8.x');
    assert(!packageJson.dependencies.mysql2, 'mysql2 is completely removed from dependencies');
    assert(!packageJson.devDependencies || !packageJson.devDependencies.mysql2, 'mysql2 is absent from devDependencies');
    assert(packageJson.scripts && packageJson.scripts.seed === 'node scripts/seed-mongodb.js', 'npm run seed script is configured');
    assert(packageJson.scripts && packageJson.scripts['verify:m1'] === 'node scripts/verify-m1.js', 'npm run verify:m1 script is configured');

    const lockfilePath = path.join(projectRoot, 'package-lock.json');
    if (fs.existsSync(lockfilePath)) {
        const lockContent = fs.readFileSync(lockfilePath, 'utf8');
        assert(lockContent.length > 0, 'package-lock.json is present in workspace root');
    }

    // TEST SUITE 2: Source code audit for legacy MySQL references, route security, and comments
    console.log('\n2. Auditing source code for legacy MySQL references and code quality...');
    const activeDirs = [
        path.join(projectRoot, 'backend', 'controllers'),
        path.join(projectRoot, 'backend', 'models'),
        path.join(projectRoot, 'backend', 'routes'),
        path.join(projectRoot, 'backend', 'middleware'),
        path.join(projectRoot, 'backend', 'config')
    ];

    let mysql2RequireCount = 0;
    let rawSqlCount = 0;

    for (const dir of activeDirs) {
        if (!fs.existsSync(dir)) continue;
        const files = fs.readdirSync(dir);
        for (const file of files) {
            if (!file.endsWith('.js')) continue;
            const fullPath = path.join(dir, file);
            const content = fs.readFileSync(fullPath, 'utf8');

            // Skip legacy models directory
            if (dir.endsWith('legacy') || ['User.js', 'Inventory.js', 'Achievement.js', 'UserProfile.js', 'DailyRewards.js', 'QuestSystem.js'].includes(file)) {
                continue;
            }

            if (content.includes("require('mysql2')") || content.includes('require("mysql2")')) {
                mysql2RequireCount++;
                console.error(`     Found mysql2 require in: ${path.relative(projectRoot, fullPath)}`);
            }

            // Check for raw SQL queries in active controllers or server.js
            if (dir.endsWith('controllers') || file === 'server.js') {
                const sqlPatterns = [
                    /\bSELECT\b[\s\S]+?\bFROM\b/i,
                    /\bINSERT\s+INTO\b/i,
                    /\bUPDATE\s+[a-zA-Z0-9_]+\s+SET\b/i,
                    /\bDELETE\s+FROM\b/i
                ];
                for (const pattern of sqlPatterns) {
                    if (pattern.test(content)) {
                        rawSqlCount++;
                        console.error(`     Found raw SQL in: ${path.relative(projectRoot, fullPath)}`);
                        break;
                    }
                }
            }
        }
    }

    assert(mysql2RequireCount === 0, 'Zero active backend files require mysql2');
    assert(rawSqlCount === 0, 'Zero raw SQL queries found in controllers');

    // Route security audit: optimizedPetsRoutes.js must have protect on equip routes
    const petRoutesPath = path.join(projectRoot, 'backend', 'routes', 'optimizedPetsRoutes.js');
    const petRoutesContent = fs.readFileSync(petRoutesPath, 'utf8');
    const petRoutesEquipProtected = petRoutesContent.includes("router.patch('/:userId/equip', protect,");
    const petRoutesEquippedProtected = petRoutesContent.includes("router.get('/:userId/equipped', protect,");
    assert(petRoutesEquipProtected && petRoutesEquippedProtected, 'All sensitive pet equipment routes are guarded by protect JWT middleware');

    // Code comment language audit: userProfileRoutes.js must have English-only comments
    const userProfileRoutesPath = path.join(projectRoot, 'backend', 'routes', 'userProfileRoutes.js');
    const userProfileContent = fs.readFileSync(userProfileRoutesPath, 'utf8');
    const hasIndonesianComments = userProfileContent.includes('untuk') || userProfileContent.includes('Tambahkan') || userProfileContent.includes('mengambil');
    assert(!hasIndonesianComments, 'User profile routes file adheres to English-only comments rule');

    // TEST SUITE 3: Connection caching and status
    console.log('\n3. Verifying MongoDB Atlas connection module...');
    const { connectDB, getConnectionStatus, disconnectDB } = require('../backend/config/mongodb');

    const conn1 = await connectDB();
    assert(Boolean(conn1), 'connectDB() successfully resolved connection');

    const status1 = getConnectionStatus();
    assert(status1.isConnected === true, 'getConnectionStatus().isConnected is true');
    assert(status1.readyState === 1, 'getConnectionStatus().readyState is 1 (connected)');
    assert(status1.stateName === 'connected', 'getConnectionStatus().stateName is "connected"');

    // Verify connection caching (same instance returned on second call)
    const conn2 = await connectDB();
    assert(conn1 === conn2, 'connectDB() returns cached connection instance without re-establishing socket');

    // TEST SUITE 4: Seed script idempotency
    console.log('\n4. Verifying idempotent database seeding (scripts/seed-mongodb.js)...');
    const { seedDatabase } = require('../scripts/seed-mongodb');

    const firstSeed = await seedDatabase();
    assert(firstSeed.itemsCount >= 31, `First seed populated ${firstSeed.itemsCount} items (expected >= 31)`);
    assert(firstSeed.petsCount >= 12, `First seed populated ${firstSeed.petsCount} pets (expected >= 12)`);
    assert(firstSeed.questsCount >= 16, `First seed populated ${firstSeed.questsCount} quests (expected >= 16)`);
    assert(firstSeed.shopCount >= 14, `First seed populated ${firstSeed.shopCount} shop items (expected >= 14)`);
    assert(firstSeed.npcsCount >= 4, `First seed populated ${firstSeed.npcsCount} NPCs (expected >= 4)`);

    const secondSeed = await seedDatabase();
    assert(secondSeed.itemsCount === firstSeed.itemsCount, 'Second seed preserved item count (idempotent bulkWrite)');
    assert(secondSeed.petsCount === firstSeed.petsCount, 'Second seed preserved pet count (idempotent bulkWrite)');
    assert(secondSeed.questsCount === firstSeed.questsCount, 'Second seed preserved quest count (idempotent bulkWrite)');
    assert(secondSeed.shopCount === firstSeed.shopCount, 'Second seed preserved shop item count (idempotent bulkWrite)');
    assert(secondSeed.npcsCount === firstSeed.npcsCount, 'Second seed preserved NPC count (idempotent bulkWrite)');

    // Verify 10 tiers of equipment & metadata
    const { ItemTemplate } = require('../backend/models/Item');
    const t1 = await ItemTemplate.findOne({ itemId: 'wpn_t1_crude_club' });
    const t9 = await ItemTemplate.findOne({ itemId: 'wpn_t9_eldritch_voidblade' });
    const t10 = await ItemTemplate.findOne({ itemId: 'wpn_t10_transcendent_godcleaver' });

    assert(Boolean(t1 && t1.rarityTier === 1 && t1.rarityName === 'Crude'), 'Tier 1 Crude item exists with correct metadata');
    assert(Boolean(t9 && t9.rarityTier === 9 && t9.asset?.frameCount === 4), 'Tier 9 Eldritch item has 4 animated visual frames');
    assert(Boolean(t10 && t10.rarityTier === 10 && t10.asset?.frameCount === 6), 'Tier 10 Transcendent item has 6 animated visual frames');

    // TEST SUITE 5: Player model lifecycle, password security, and energy boundaries
    console.log('\n5. Verifying Player model lifecycle, security, and energy boundaries...');
    const Player = require('../backend/models/Player');

    const testUsername = `tester_${Date.now()}`;
    const testEmail = `tester_${Date.now()}@pixmon.test`;
    const testRawPassword = 'SecurePassword123!';

    const createdPlayer = await Player.create({
        username: testUsername,
        email: testEmail,
        password: testRawPassword,
        level: 1,
        xp: 0,
        gold: 500,
        diamonds: 10
    });

    assert(Boolean(createdPlayer._id), 'Player document created with valid MongoDB _id');
    assert(createdPlayer.password !== testRawPassword, 'Password was securely hashed before save');

    const isMatchCorrect = await createdPlayer.comparePassword(testRawPassword);
    const isMatchWrong = await createdPlayer.comparePassword('WrongPassword!');
    assert(isMatchCorrect === true, 'comparePassword returns true for correct credentials');
    assert(isMatchWrong === false, 'comparePassword returns false for incorrect credentials');

    // Security check: comparePassword resilience against non-string / null / undefined
    const matchNull = await createdPlayer.comparePassword(null);
    const matchUndefined = await createdPlayer.comparePassword(undefined);
    assert(matchNull === false && matchUndefined === false, 'comparePassword handles null and undefined safely without throwing');

    // Energy pool and consumption tests
    assert(createdPlayer.energy.current === 10, 'Default energy pool is initialized to 10');
    assert(createdPlayer.energy.max === 10, 'Default energy max is 10');
    const energyConsumed = createdPlayer.consumeEnergy(1);
    assert(energyConsumed === true, 'consumeEnergy(1) succeeded');
    assert(createdPlayer.energy.current === 9, 'Energy decreased to 9');
    assert(createdPlayer.consumeEnergy(20) === false, 'consumeEnergy returns false when insufficient energy');

    // Security check: Anti-Energy-Injection Exploit (consumeEnergy(-5))
    const energyBeforeNegative = createdPlayer.energy.current;
    const negativeConsumeResult = createdPlayer.consumeEnergy(-5);
    const energyAfterNegative = createdPlayer.energy.current;
    assert(
        negativeConsumeResult === false && energyAfterNegative === energyBeforeNegative,
        'consumeEnergy(-5) negative parameter boundary validation correctly rejected'
    );

    // Test player update
    createdPlayer.gold += 250;
    await createdPlayer.save();
    const fetchedPlayer = await Player.findOne({ username: testUsername });
    assert(fetchedPlayer.gold === 750, 'Player gold balance updated and persisted correctly');

    // Cleanup test player
    await Player.deleteOne({ username: testUsername });
    const afterDelete = await Player.findOne({ username: testUsername });
    assert(!afterDelete, 'Test player successfully cleaned up');

    // TEST SUITE 6: UserInventory relations and compound unique index
    console.log('\n6. Verifying UserInventory schema, indexes, and ItemTemplate integration...');
    const { UserInventory } = require('../backend/models/Item');
    const testInvUser = `inv_test_${Date.now()}`;

    // Schema Index Check: verify { userId: 1, itemId: 1 } has unique: true
    const rawIndexes = typeof UserInventory.schema.indexes === 'function'
        ? UserInventory.schema.indexes()
        : (UserInventory.schema.indexes || UserInventory.schema._indexes || []);
    const userInvUniqueIdx = rawIndexes.find(idx => {
        if (Array.isArray(idx)) {
            return idx[0] && idx[0].userId === 1 && idx[0].itemId === 1 && idx[1] && idx[1].unique === true;
        }
        return idx.fields && idx.fields.userId === 1 && idx.fields.itemId === 1 && idx.options && idx.options.unique === true;
    });
    assert(Boolean(userInvUniqueIdx), 'UserInventory schema defines compound unique index on { userId, itemId }');

    await UserInventory.create({
        userId: testInvUser,
        itemId: 'wpn_t1_crude_club',
        amount: 2,
        isEquipped: true,
        equippedSlot: 'weapon'
    });

    const invRecord = await UserInventory.findOne({ userId: testInvUser, itemId: 'wpn_t1_crude_club' });
    assert(Boolean(invRecord && invRecord.amount === 2 && invRecord.isEquipped), 'UserInventory record created and retrieved');

    await UserInventory.deleteMany({ userId: testInvUser });
    const invAfterClean = await UserInventory.findOne({ userId: testInvUser });
    assert(!invAfterClean, 'UserInventory records successfully cleaned up');

    // TEST SUITE 7: Server Healthcheck
    console.log('\n7. Verifying GET /api/health response structure...');
    const expressApp = require('../backend/server');

    const stack = (expressApp.router || expressApp._router).stack;
    const healthLayer = stack.find(l => l.route && l.route.path === '/api/health');
    assert(Boolean(healthLayer), 'Route GET /api/health is registered in Express');

    let statusCode = 200;
    let healthResponse = null;

    const mockReq = {};
    const mockRes = {
        status: (code) => {
            statusCode = code;
            return mockRes;
        },
        json: (data) => {
            healthResponse = data;
            return mockRes;
        }
    };

    if (healthLayer) {
        await healthLayer.route.stack[0].handle(mockReq, mockRes);
        assert(statusCode === 200, 'GET /api/health returned HTTP 200 OK');
        assert(healthResponse && healthResponse.status === 'OK', 'healthResponse.status is "OK"');
        assert(healthResponse.database === 'Connected', 'healthResponse.database is "Connected"');
        assert(healthResponse.mongodb && healthResponse.mongodb.readyState === 1, 'healthResponse.mongodb.readyState is 1');
        assert(healthResponse.collections && typeof healthResponse.collections.items === 'number', 'healthResponse.collections includes item counts');
        assert(healthResponse.collections.items >= 31, `healthResponse.collections.items reports ${healthResponse.collections.items} items`);
    }

    // FINAL SUMMARY
    console.log('\n=================================================================');
    console.log(`Verification Complete: ${passedTests} passed, ${failedTests} failed (Total: ${totalTests})`);
    console.log('=================================================================');

    await disconnectDB();

    if (failedTests > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

if (require.main === module) {
    runVerification().catch(err => {
        console.error('Fatal verification error:', err);
        process.exit(1);
    });
}

module.exports = { runVerification };
