const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    static async createTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;
        try {
            await db.query(sql);
            console.log('Users table created or already exists');
        } catch (error) {
            console.error('Error creating users table:', error);
            throw error;
        }
    }

    static async register(username, email, password) {
        try {
            console.log('Attempting to register user:', { username, email });
            
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            console.log('Password hashed successfully');
            
            // Insert user
            const [result] = await db.query(
                'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                [username, email, hashedPassword]
            );
            
            console.log('User registered successfully:', result.insertId);
            return result.insertId;
        } catch (error) {
            console.error('Registration error:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                if (error.message.includes('username')) {
                    throw new Error('Username already exists');
                } else if (error.message.includes('email')) {
                    throw new Error('Email already exists');
                }
            }
            throw error;
        }
    }

    static async login(username, password) {
        try {
            // Find user
            const [users] = await db.query(
                'SELECT * FROM users WHERE username = ?',
                [username]
            );

            if (users.length === 0) {
                throw new Error('User not found');
            }

            const user = users[0];

            // Check password
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                throw new Error('Invalid password');
            }

            // Return user data (excluding password)
            const { password: _, ...userData } = user;
            return userData;
        } catch (error) {
            throw error;
        }
    }

    static async findById(id) {
        try {
            const [users] = await db.query(
                'SELECT id, username, email, created_at, updated_at FROM users WHERE id = ?',
                [id]
            );
            return users[0] || null;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = User; 