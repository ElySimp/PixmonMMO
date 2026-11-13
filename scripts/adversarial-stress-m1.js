/**
 * scripts/adversarial-stress-m1.js
 * Adversarial Stress Harness for Milestone 1 Mongoose Data Layer
 * 
 * Verifies:
 * 1. Concurrency stress & race conditions (atomic vs read-modify-write, double claim)
 * 2. Compound unique indexes (UserQuestProgress duplicate rejection, UserInventory uniqueness claim audit)
 * 3. Energy boundary limits & negative consumption exploit attempts
 * 4. Password hashing security, salt uniqueness, and auth resilience
 */

const { connectDB, disconnectDB } = require('../backend/config/mongodb');
const Player = require('../backend/models/Player');
const { UserQuestProgress, QuestTemplate } = require('../backend/models/Quest');
const { UserInventory, ItemTemplate } = require('../backend/models/Item');

let results = {
    total: 0,
    passed: 0,
    failed: 0,
    findings: []
};

function recordTest(name, passed, detail = '') {
    results.total++;
    if (passed) {
        results.passed++;
        console.log(`  [PASS] ${name}`);
    } else {
        results.failed++;
        console.error(`  [FAIL] ${name}${detail ? ` -> ${detail}` : ''}`);
        results.findings.push({ name, detail });
    }
}

async function runAdversarialTests() {
    console.log('=================================================================');
    console.log('   PixmonMMO Milestone 1: Adversarial Stress Test Suite');
    console.log('=================================================================\n');

    await connectDB();

    if (typeof Player.syncIndexes === 'function') {
        await Player.syncIndexes();
    }
    if (typeof UserQuestProgress.syncIndexes === 'function') {
        await UserQuestProgress.syncIndexes();
    }
    if (typeof UserInventory.syncIndexes === 'function') {
        await UserInventory.syncIndexes();
    }

    const timestamp = Date.now();

    // =========================================================================
    // SUITE 1: CONCURRENCY STRESS & RACE CONDITIONS
    // =========================================================================
    console.log('1. Concurrency Stress & Race Conditions...');

    // Test 1.1: 20 concurrent atomic $inc mutations on Player gold
    const testPlayer1 = await Player.create({
        username: `stress_atomic_${timestamp}`,
        email: `stress_atomic_${timestamp}@test.com`,
        password: 'Password123!',
        gold: 100
    });

    const atomicIncrements = Array.from({ length: 20 }, () =>
        Player.findByIdAndUpdate(testPlayer1._id, { $inc: { gold: 10 } }, { new: true })
    );
    await Promise.all(atomicIncrements);

    const reloadedPlayer1 = await Player.findById(testPlayer1._id);
    recordTest(
        'Concurrent atomic $inc updates (20 x +10 gold on base 100)',
        reloadedPlayer1.gold === 300,
        `Expected gold 300, got ${reloadedPlayer1.gold}`
    );

    // Test 1.2: 10 concurrent non-atomic read-modify-save calls (testing for lost updates)
    const testPlayer2 = await Player.create({
        username: `stress_rms_${timestamp}`,
        email: `stress_rms_${timestamp}@test.com`,
        password: 'Password123!',
        gold: 100
    });

    const nonAtomicUpdates = Array.from({ length: 10 }, async () => {
        const p = await Player.findById(testPlayer2._id);
        p.gold += 10;
        await p.save();
    });
    await Promise.all(nonAtomicUpdates);

    const reloadedPlayer2 = await Player.findById(testPlayer2._id);
    const hasLostUpdates = reloadedPlayer2.gold !== 200;
    recordTest(
        'Read-Modify-Save concurrency vulnerability detection (Race Condition)',
        !hasLostUpdates,
        `Non-atomic concurrent updates produced gold = ${reloadedPlayer2.gold} instead of 200 (VULNERABILITY: Lost updates confirmed)`
    );

    // Test 1.3: Concurrent quest claim double-spend check
    const questUser = `quest_user_${timestamp}`;
    const testQuestProgress = await UserQuestProgress.create({
        userId: questUser,
        questId: 'test_daily_slimy',
        repeatType: 'daily',
        periodKey: `2026-11-11_${timestamp}`,
        target: 5,
        progress: 5,
        completed: true,
        claimed: false
    });

    let claimSuccessCount = 0;
    const claimAttempts = Array.from({ length: 2 }, async () => {
        // Simulating questController.claimQuestReward logic
        const prog = await UserQuestProgress.findOne({
            userId: questUser,
            questId: 'test_daily_slimy',
            periodKey: `2026-11-11_${timestamp}`
        });
        if (prog && prog.completed && !prog.claimed) {
            prog.claimed = true;
            await prog.save();
            claimSuccessCount++;
        }
    });
    await Promise.all(claimAttempts);

    recordTest(
        'Quest claim TOCTOU race condition resilience',
        claimSuccessCount === 1,
        `Claim succeeded ${claimSuccessCount} times (VULNERABILITY: Concurrent requests double-claim reward)`
    );

    // Clean up Suite 1 test docs
    await Player.deleteMany({ _id: { $in: [testPlayer1._id, testPlayer2._id] } });
    await UserQuestProgress.deleteMany({ userId: questUser });


    // =========================================================================
    // SUITE 2: COMPOUND UNIQUE INDEX & DUPLICATE REJECTION
    // =========================================================================
    console.log('\n2. Compound Unique Index & Duplicate Rejection...');

    // Test 2.1: Schema definition audit for UserQuestProgress unique compound index
    const questIndexes = UserQuestProgress.schema.indexes;
    const userQuestUniqueIdx = questIndexes.find(idx => 
        idx.fields && idx.fields.userId === 1 && idx.fields.questId === 1 && idx.fields.periodKey === 1 && idx.options && idx.options.unique === true
    );
    recordTest(
        'UserQuestProgress schema defines compound unique index on { userId, questId, periodKey }',
        Boolean(userQuestUniqueIdx),
        `Found compound unique index: ${Boolean(userQuestUniqueIdx)}`
    );

    // Test 2.2: UserInventory schema definition audit (verifying worker handoff claim)
    const itemIndexes = UserInventory.schema.indexes;
    const userInvUniqueIdx = itemIndexes.find(idx =>
        idx.fields && idx.fields.userId === 1 && idx.fields.itemId === 1 && idx.options && idx.options.unique === true
    );
    recordTest(
        'UserInventory schema defines compound unique index on { userId, itemId } (Worker claim verification)',
        Boolean(userInvUniqueIdx),
        `UserInventory compound index has unique:true: ${Boolean(userInvUniqueIdx)} (Worker handoff claimed unique compound index, but Item.js line 145 lacks { unique: true })`
    );

    // Test 2.3: Sequential duplicate insertion on UserQuestProgress
    const testUserId = `u_${timestamp}`;
    const periodKey = '2026-11-11';
    let duplicateRejected = false;
    let duplicateErrorCode = null;

    try {
        await UserQuestProgress.create({
            userId: testUserId,
            questId: 'quest_daily_slime_hunter',
            repeatType: 'daily',
            periodKey,
            target: 5,
            progress: 1
        });
        await UserQuestProgress.create({
            userId: testUserId,
            questId: 'quest_daily_slime_hunter',
            repeatType: 'daily',
            periodKey,
            target: 5,
            progress: 2
        });
    } catch (err) {
        duplicateRejected = true;
        duplicateErrorCode = err.code || err.name;
    }

    const questRecordsCount = await UserQuestProgress.countDocuments({
        userId: testUserId,
        questId: 'quest_daily_slime_hunter',
        periodKey
    });

    recordTest(
        'UserQuestProgress runtime duplicate rejection on { userId, questId, periodKey }',
        duplicateRejected && questRecordsCount === 1,
        `Duplicate rejected: ${duplicateRejected}, Records created: ${questRecordsCount} (Mock driver / Atlas constraint check)`
    );

    // Test 2.4: Player username uniqueness & case-insensitivity
    let duplicateUsernameRejected = false;
    const testUsername = `player_${timestamp}`;
    const pOriginal = await Player.create({
        username: testUsername,
        email: `${testUsername}@pixmon.test`,
        password: 'Password123!'
    });

    try {
        await Player.create({
            username: testUsername.toUpperCase(),
            email: `another_${timestamp}@pixmon.test`,
            password: 'Password123!'
        });
    } catch (err) {
        duplicateUsernameRejected = true;
    }

    const playerCount = await Player.countDocuments({ username: testUsername.toLowerCase() });
    recordTest(
        'Player username case-insensitive unique constraint enforcement',
        duplicateUsernameRejected && playerCount === 1,
        `Duplicate rejected: ${duplicateUsernameRejected}, Duplicate players found: ${playerCount}`
    );

    // Clean up Suite 2 test docs
    await UserQuestProgress.deleteMany({ userId: testUserId });
    await Player.deleteOne({ _id: pOriginal._id });


    // =========================================================================
    // SUITE 3: PLAYER ENERGY BOUNDARY & EXPLOITATION TESTING
    // =========================================================================
    console.log('\n3. Player Energy Boundary & Exploitation Testing...');

    const energyPlayer = await Player.create({
        username: `energy_test_${timestamp}`,
        email: `energy_${timestamp}@test.com`,
        password: 'Password123!',
        energy: { current: 10, max: 10 }
    });

    // Test 3.1: Normal consumption
    const c1 = energyPlayer.consumeEnergy(3);
    recordTest(
        'consumeEnergy(3) on 10 energy reduces current to 7',
        c1 === true && energyPlayer.energy.current === 7,
        `Result: ${c1}, current: ${energyPlayer.energy.current}`
    );

    // Test 3.2: Consume down to 0
    const c2 = energyPlayer.consumeEnergy(7);
    recordTest(
        'consumeEnergy(7) on 7 energy reduces current to 0',
        c2 === true && energyPlayer.energy.current === 0,
        `Result: ${c2}, current: ${energyPlayer.energy.current}`
    );

    // Test 3.3: Over-consumption rejection
    const c3 = energyPlayer.consumeEnergy(1);
    recordTest(
        'consumeEnergy(1) on 0 energy is rejected (returns false)',
        c3 === false && energyPlayer.energy.current === 0,
        `Result: ${c3}, current: ${energyPlayer.energy.current}`
    );

    // Test 3.4: Exploit Attempt: Negative Energy Consumption (consumeEnergy(-5))
    // Calling consumeEnergy(-5) with negative amount
    const negativeExploitAttempt = energyPlayer.consumeEnergy(-5);
    const energyAfterNegative = energyPlayer.energy.current;

    const exploitPrevented = negativeExploitAttempt === false && energyAfterNegative === 0;
    recordTest(
        'consumeEnergy negative parameter boundary validation (consumeEnergy(-5))',
        exploitPrevented,
        `VULNERABILITY: consumeEnergy(-5) returned ${negativeExploitAttempt}; energy increased from 0 to ${energyAfterNegative} (Allowed negative consumption to bypass max)`
    );

    // Test 3.5: Schema definition audit: energy.current specifies min: 0
    const currentEnergyDef = Player.schema.definition?.energy?.current;
    recordTest(
        'PlayerSchema definition enforces min: 0 constraint on energy.current',
        currentEnergyDef && currentEnergyDef.min === 0,
        `min value defined: ${currentEnergyDef?.min}`
    );

    // Test 3.6: Passive refill does not exceed energy.max (10)
    const refillPlayer = new Player({
        username: `refill_${timestamp}`,
        email: `refill_${timestamp}@test.com`,
        password: 'Password123!',
        energy: {
            current: 8,
            max: 10,
            lastRefillAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
        }
    });

    refillPlayer.refillEnergy();
    recordTest(
        'refillEnergy() caps at energy.max (10) after 24h elapsed',
        refillPlayer.energy.current === 10,
        `Energy refilled to: ${refillPlayer.energy.current} (expected 10)`
    );

    // Clean up Suite 3 test docs
    await Player.deleteOne({ _id: energyPlayer._id });


    // =========================================================================
    // SUITE 4: PASSWORD SECURITY & AUTHENTICATION ATTACK VECTORS
    // =========================================================================
    console.log('\n4. Password Security & Authentication Attack Vectors...');

    const rawPassword = 'AdversarialTestPassword99!';
    const authPlayer1 = await Player.create({
        username: `auth_sec1_${timestamp}`,
        email: `auth_sec1_${timestamp}@test.com`,
        password: rawPassword
    });

    const authPlayer2 = await Player.create({
        username: `auth_sec2_${timestamp}`,
        email: `auth_sec2_${timestamp}@test.com`,
        password: rawPassword
    });

    // Test 4.1: Plaintext password is never stored
    recordTest(
        'Password is never stored in plaintext in the database',
        authPlayer1.password !== rawPassword && authPlayer1.password.startsWith('$2'),
        `Stored password prefix: ${authPlayer1.password.substring(0, 10)}...`
    );

    // Test 4.2: Unique salt per player (rainbow table defense)
    recordTest(
        'Unique cryptographic salt generated per document for identical passwords',
        authPlayer1.password !== authPlayer2.password,
        `Player1 hash: ${authPlayer1.password.substring(0, 15)}... vs Player2 hash: ${authPlayer2.password.substring(0, 15)}...`
    );

    // Test 4.3: comparePassword edge cases
    let correctMatch = false;
    let wrongMatch = true;
    let emptyMatch = true;
    let nullErrorOrFalse = false;
    let undefinedErrorOrFalse = false;

    try {
        correctMatch = await authPlayer1.comparePassword(rawPassword);
    } catch (e) { correctMatch = false; }

    try {
        wrongMatch = await authPlayer1.comparePassword('WrongPassword!');
    } catch (e) { wrongMatch = false; }

    try {
        emptyMatch = await authPlayer1.comparePassword('');
    } catch (e) { emptyMatch = false; }

    try {
        const nullRes = await authPlayer1.comparePassword(null);
        nullErrorOrFalse = nullRes === false;
    } catch (err) {
        // Uncaught error in bcrypt.compare because candidate is not a string
        nullErrorOrFalse = false;
    }

    try {
        const undefRes = await authPlayer1.comparePassword(undefined);
        undefinedErrorOrFalse = undefRes === false;
    } catch (err) {
        undefinedErrorOrFalse = false;
    }

    recordTest(
        'comparePassword handles non-string/null/undefined candidates safely without throwing',
        correctMatch === true && wrongMatch === false && emptyMatch === false && nullErrorOrFalse && undefinedErrorOrFalse,
        `VULNERABILITY: comparePassword(null/undefined) throws unhandled exception: nullOk=${nullErrorOrFalse}, undefOk=${undefinedErrorOrFalse}`
    );

    // Test 4.4: Candidate == hash string fails
    const hashAsCandidate = await authPlayer1.comparePassword(authPlayer1.password);
    recordTest(
        'Candidate matching hash string directly is rejected',
        hashAsCandidate === false,
        `Result when hash is candidate: ${hashAsCandidate}`
    );

    // Test 4.5: Password stripped in toJSON() output
    const jsonOutput = authPlayer1.toJSON();
    recordTest(
        'toJSON() strips password hash from serialized output',
        jsonOutput.password === undefined,
        `Serialized password exists: ${jsonOutput.password !== undefined}`
    );

    // Test 4.6: Pre-save hook does not re-hash already hashed password on unrelated update
    const hashBeforeUpdate = authPlayer1.password;
    authPlayer1.gold += 50;
    await authPlayer1.save();

    const playerAfterUpdate = await Player.findById(authPlayer1._id);
    recordTest(
        'Pre-save hook preserves existing password hash when password is not modified',
        authPlayer1.password === hashBeforeUpdate,
        `Hash matched: ${authPlayer1.password === hashBeforeUpdate}`
    );

    // Clean up Suite 4 test docs
    await Player.deleteMany({ _id: { $in: [authPlayer1._id, authPlayer2._id] } });


    // =========================================================================
    // FINAL SUMMARY
    // =========================================================================
    console.log('\n=================================================================');
    console.log(`Adversarial Stress Verification Complete: ${results.passed} passed, ${results.failed} failed (Total: ${results.total})`);
    console.log('=================================================================');

    if (results.findings.length > 0) {
        console.log('\nConfirmed Vulnerabilities / Findings:');
        results.findings.forEach((f, idx) => {
            console.log(`  ${idx + 1}. [${f.name}]`);
            console.log(`     Detail: ${f.detail}`);
        });
    }

    await disconnectDB();

    return results;
}

if (require.main === module) {
    runAdversarialTests().catch(err => {
        console.error('Fatal adversarial test error:', err);
        process.exit(1);
    });
}

module.exports = { runAdversarialTests };
