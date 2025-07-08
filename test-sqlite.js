// Test Database Connection
const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'dev.db');

console.log('Testing SQLite database connection...');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error connecting to database:', err.message);
        return;
    }
    console.log('✅ Connected to SQLite database');

    // Test if User table exists
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='User';", (err, rows) => {
        if (err) {
            console.error('❌ Error checking tables:', err.message);
            return;
        }
        
        if (rows.length > 0) {
            console.log('✅ User table exists');
            
            // Check table structure
            db.all("PRAGMA table_info(User);", (err, columns) => {
                if (err) {
                    console.error('❌ Error checking table structure:', err.message);
                    return;
                }
                
                console.log('📋 User table structure:');
                columns.forEach(col => {
                    console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : 'NULL'} ${col.pk ? 'PRIMARY KEY' : ''}`);
                });
                
                const hasPassword = columns.some(col => col.name === 'password');
                console.log(`🔑 Password field exists: ${hasPassword ? '✅ Yes' : '❌ No'}`);
                
                db.close();
            });
        } else {
            console.log('❌ User table does not exist - database needs to be migrated');
            db.close();
        }
    });
});
