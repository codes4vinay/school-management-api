const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const { z } = require('zod');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Validation schemas using Zod
const addSchoolSchema = z.object({
    name: z.string().trim().min(1, 'Name cannot be empty'),
    address: z.string().trim().min(1, 'Address cannot be empty'),
    latitude: z.number().min(-90, 'Latitude must be >= -90').max(90, 'Latitude must be <= 90'),
    longitude: z.number().min(-180, 'Longitude must be >= -180').max(180, 'Longitude must be <= 180')
});

const listSchoolsSchema = z.object({
    latitude: z.string().refine(val => !isNaN(parseFloat(val)), 'Invalid latitude').transform(Number).pipe(
        z.number().min(-90, 'Latitude must be >= -90').max(90, 'Latitude must be <= 90')
    ),
    longitude: z.string().refine(val => !isNaN(parseFloat(val)), 'Invalid longitude').transform(Number).pipe(
        z.number().min(-180, 'Longitude must be >= -180').max(180, 'Longitude must be <= 180')
    )
});

// Create MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

//  check endpoint
app.get('/', (req, res) => {
    res.status(200).json({ message: 'API is running' });
});

// POST endpoint to add a school
app.post('/addSchool', async (req, res) => {
    try {
        // Validate using Zod
        const validation = addSchoolSchema.safeParse(req.body);
        if (!validation.success) {
            const errors = validation.error.errors.map(err => err.message).join(', ');
            return res.status(400).json({
                success: false,
                message: errors
            });
        }

        const { name, address, latitude, longitude } = validation.data;

        // Get connection from pool
        const connection = await pool.getConnection();

        try {
            // Insert school into database
            const query = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
            const [result] = await connection.execute(query, [name, address, latitude, longitude]);

            res.status(201).json({
                success: true,
                message: 'School added successfully',
                schoolId: result.insertId
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error adding school:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding school',
            error: error.message
        });
    }
});

// GET endpoint to list schools sorted by proximity
app.get('/listSchools', async (req, res) => {
    try {
        // Validate using Zod
        const validation = listSchoolsSchema.safeParse(req.query);
        if (!validation.success) {
            const errors = validation.error.errors.map(err => err.message).join(', ');
            return res.status(400).json({
                success: false,
                message: errors
            });
        }

        const { latitude: userLat, longitude: userLon } = validation.data;

        // Get connection from pool
        const connection = await pool.getConnection();

        try {
            // Fetch all schools from database
            const query = 'SELECT id, name, address, latitude, longitude FROM schools';
            const [schools] = await connection.execute(query);

            if (schools.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: 'No schools found',
                    schools: []
                });
            }

            // Calculate distance for each school using Haversine formula
            const schoolsWithDistance = schools.map(school => {
                const distance = calculateDistance(userLat, userLon, school.latitude, school.longitude);
                return {
                    ...school,
                    distance: parseFloat(distance.toFixed(2))
                };
            });

            // Sort by distance (ascending)
            schoolsWithDistance.sort((a, b) => a.distance - b.distance);

            res.status(200).json({
                success: true,
                message: 'Schools retrieved and sorted by proximity',
                userLocation: { latitude: userLat, longitude: userLon },
                schools: schoolsWithDistance
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error retrieving schools:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving schools',
            error: error.message
        });
    }
});

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
    });
});

// 404 
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});


app.listen(PORT, () => {
    console.log(`School Management API running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
