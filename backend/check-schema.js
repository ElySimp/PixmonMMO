/**
 * check-schema.js - Quick utility to check the Pets table structure
 */

const db = require('./config/database'); 

async function checkSchema() { 
    try { 
        const [rows] = await db.query('DESCRIBE Pets'); 
        console.log('Pets Table Structure:'); 
        console.log(rows); 
        process.exit(0); 
    } catch (error) { 
        console.error('Error:', error); 
        process.exit(1); 
    } 
} 

checkSchema();
