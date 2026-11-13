/**
 * DEPRECATED: MySQL Database Configuration
 * 
 * As part of Milestone 1 (Database Migration & Backend Persistence),
 * PixmonMMO has transitioned entirely from MySQL to MongoDB Atlas with Mongoose.
 * 
 * Please use Mongoose models from `backend/models/` and connection utilities
 * from `backend/config/mongodb.js`.
 */

module.exports = {
    query: async () => {
        throw new Error('MySQL connection pool has been deprecated. Please use Mongoose models in backend/models/ instead.');
    },
    execute: async () => {
        throw new Error('MySQL connection pool has been deprecated. Please use Mongoose models in backend/models/ instead.');
    },
    getConnection: async () => {
        throw new Error('MySQL connection pool has been deprecated. Please use backend/config/mongodb.js instead.');
    }
};
