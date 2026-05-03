const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function setupDatabase() {
    try {
        // Connect to MySQL server
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT
        });

        console.log('Connected to MySQL');

        // Create database if it doesn't exist
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
        console.log(`Database '${process.env.DB_NAME}' created or already exists`);

        // Select the database
        await connection.query(`USE ${process.env.DB_NAME}`);

        // Create schools table
        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS schools (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address VARCHAR(500) NOT NULL,
        latitude FLOAT NOT NULL,
        longitude FLOAT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `;

        await connection.execute(createTableQuery);
        console.log('Schools table created or already exists');

        // Insert sample data
        const sampleDataQuery = `
      INSERT INTO schools (name, address, latitude, longitude) VALUES
      ('Green Valley School', '123 Main Street, Downtown', 40.7128, -74.0060),
      ('Riverside Academy', '456 River Road, North Side', 40.7282, -73.9942),
      ('Mountain View High School', '789 Mountain Path, West Side', 40.7489, -73.9680),
      ('Lakeside Public School', '321 Lake Avenue, South Side', 40.7061, -74.0088),
      ('Central School District', '654 Central Boulevard, City Center', 40.7306, -73.9979);
    `;

        // Check if data already exists to avoid duplicates
        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM schools');
        if (rows[0].count === 0) {
            await connection.execute(sampleDataQuery);
            console.log('Sample data inserted successfully');
        } else {
            console.log('Sample data already exists');
        }

        await connection.end();
        console.log('Database setup completed successfully');
    } catch (error) {
        console.error('Error setting up database:', error.message);
        process.exit(1);
    }
}

// Run setup
setupDatabase();
