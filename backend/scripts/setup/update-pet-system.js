/**
 * Script to update the database schema for the pet system
 * Runs all necessary schema update scripts
 */

const path = require('path');
const { exec } = require('child_process');

console.log('Running pet system database updates...');

// List of scripts to run in order
const scripts = [
    'add-pet-status-columns.js',
    'add-last-played-at.js'
];

// Run each script sequentially
async function runScripts() {
    for (const script of scripts) {
        const scriptPath = path.join(__dirname, '..', 'database-fixes', script);
        console.log(`Running script: ${script}`);
        
        try {
            // Use node to run the script
            await new Promise((resolve, reject) => {
                exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Error executing ${script}:`, error);
                        reject(error);
                        return;
                    }
                    
                    console.log(stdout);
                    if (stderr) {
                        console.error(stderr);
                    }
                    
                    resolve();
                });
            });
            
            console.log(`Completed script: ${script}`);
        } catch (error) {
            console.error(`Failed to run script ${script}:`, error);
            process.exit(1);
        }
    }
    
    console.log('All database updates completed successfully');
}

runScripts();
