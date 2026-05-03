# School Management API

A Node.js REST API for managing schools with features to add schools and retrieve schools sorted by proximity to a user's location.

## Features

- **Add School**: POST endpoint to add new schools to the database with validation
- **List Schools**: GET endpoint to retrieve all schools sorted by distance from user's location
- **Distance Calculation**: Uses Haversine formula for accurate geographical distance calculation
- **Input Validation**: validation for all inputs using zod schema validation
- **MySQL Database**: Persistent data storage
- **Error Handling**: Robust error handling 

## Tech Stack

- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **MySQL2**: Database driver 
- **dotenv**: Environment variable management

## Prerequisites

- Node.js (v14 or higher)
- MySQL Server (v5.7 or higher)
- npm or yarn package manager

## Installation

1. **Clone or download the project**

   ```bash
   cd school-management-api
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment Variables**

   Edit the `.env` file with your MySQL credentials:

   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=school_management
   DB_PORT=3306
   PORT=5000
   ```

4. **Setup Database**

   Run the database setup script to create the database and tables:

   ```bash
   node setup-db.js
   ```

   This will:
   - Create the `school_management` database
   - Create the `schools` table
   - Insert sample school data

## Running the Server

### Development mode (with auto-reload):

```bash
npm run dev
```

### Production mode:

```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### 1. Check

- **URL**: `/`
- **Method**: `GET`
- **Description**: Check if the API is running
- **Response**:
  ```json
  {
    "message": "API is running"
  }
  ```

### 2. Add School

- **URL**: `/addSchool`
- **Method**: `POST`
- **Description**: Add a new school to the database
- **Request Body**:
  ```json
  {
    "name": "School Name",
    "address": "School Address",
    "latitude": 40.7128,
    "longitude": -74.006
  }
  ```
- **Success Response** (201):
  ```json
  {
    "success": true,
    "message": "School added successfully",
    "schoolId": 6
  }
  ```
- **Error Response** (400):
  ```json
  {
    "success": false,
    "message": "Error message describing what went wrong"
  }
  ```

### 3. List Schools by Proximity

- **URL**: `/listSchools`
- **Method**: `GET`
- **Parameters**:
  - `latitude` (required): User's latitude (query parameter)
  - `longitude` (required): User's longitude (query parameter)
- **Example URL**: `/listSchools?latitude=40.7128&longitude=-74.0060`
- **Success Response** (200):
  ```json
  {
    "success": true,
    "message": "Schools retrieved and sorted by proximity",
    "userLocation": {
      "latitude": 40.7128,
      "longitude": -74.006
    },
    "schools": [
      {
        "id": 1,
        "name": "Green Valley School",
        "address": "123 Main Street, Downtown",
        "latitude": 40.7128,
        "longitude": -74.006,
        "distance": 0.0
      },
      {
        "id": 2,
        "name": "Riverside Academy",
        "address": "456 River Road, North Side",
        "latitude": 40.7282,
        "longitude": -73.9942,
        "distance": 2.15
      }
    ]
  }
  ```
- **Error Response** (400):
  ```json
  {
    "success": false,
    "message": "User latitude and longitude parameters are required"
  }
  ```

## Validation Rules

### Add School Endpoint:

- All fields (name, address, latitude, longitude) are required
- Name and address must be non-empty strings
- Latitude must be a number between -90 and 90
- Longitude must be a number between -180 and 180

### List Schools Endpoint:

- Latitude and longitude query parameters are required
- Both must be valid numbers within valid ranges


## Testing

Use the provided Postman collection to test the APIs. See `postman-collection.json` for complete details.

### Example cURL requests:

**Add School**:

```bash
curl -X POST http://localhost:5000/addSchool \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New School",
    "address": "999 New Street",
    "latitude": 40.758,
    "longitude": -73.985
  }'
```

**List Schools**:

```bash
curl -X GET "http://localhost:5000/listSchools?latitude=40.7128&longitude=-74.0060"
```

## Database Schema

### schools table

```sql
CREATE TABLE schools (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500) NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Project Structure

```
school-management-api/
├── server.js           # Main Express application and API endpoints
├── setup-db.js         # Database initialization script
├── package.json        # Project dependencies
├── .env               # Environment variables (configure with your settings)
├── README.md          # This file
└── postman-collection.json # Postman collection for testing
```

## Error Handling

The API provides meaningful error responses for various scenarios:

- **400 Bad Request**: Invalid input or missing required parameters
- **404 Not Found**: Endpoint doesn't exist
- **500 Internal Server Error**: Server-side errors with detailed messages in development


## License

MIT

## Support

For issues or questions, please refer to the project documentation or create an issue in the repository.
