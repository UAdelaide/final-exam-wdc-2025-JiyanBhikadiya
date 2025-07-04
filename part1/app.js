var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mysql = require('mysql2/promise');
const cors = require('cors');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());

let db;

(async () => {
    try {
        // Connect to MySQL without specifying a database
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '' // Set your MySQL root password
        });

        // Create the database if it doesn't exist
        await connection.query('CREATE DATABASE IF NOT EXISTS DogWalkService');
        await connection.end();

        // Now connect to the created database
        db = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'DogWalkService'
        });

        // Create a table if it doesn't exist
        await db.execute(`
            CREATE TABLE IF NOT EXISTS Users (
                user_id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('owner', 'walker') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        // Create a table if it doesn't exist
        await db.execute(`
            CREATE TABLE IF NOT EXISTS Dogs (
                dog_id INT AUTO_INCREMENT PRIMARY KEY,
                owner_id INT NOT NULL,
                name VARCHAR(50) NOT NULL,
                size ENUM('small', 'medium', 'large') NOT NULL,
                FOREIGN KEY (owner_id) REFERENCES Users(user_id)
            );
        `);
        // Create a table if it doesn't exist
        await db.execute(`
            CREATE TABLE IF NOT EXISTS WalkRequests (
                request_id INT AUTO_INCREMENT PRIMARY KEY,
                dog_id INT NOT NULL,
                requested_time DATETIME NOT NULL,
                duration_minutes INT NOT NULL,
                location VARCHAR(255) NOT NULL,
                status ENUM('open', 'accepted', 'completed', 'cancelled') DEFAULT 'open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (dog_id) REFERENCES Dogs(dog_id)
            );
        `);
        // Create a table if it doesn't exist
        await db.execute(`
            CREATE TABLE IF NOT EXISTS WalkApplications (
                application_id INT AUTO_INCREMENT PRIMARY KEY,
                request_id INT NOT NULL,
                walker_id INT NOT NULL,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
                FOREIGN KEY (request_id) REFERENCES WalkRequests(request_id),
                FOREIGN KEY (walker_id) REFERENCES Users(user_id),
                CONSTRAINT unique_application UNIQUE (request_id, walker_id)
            );
        `);
        // Create a table if it doesn't exist
        await db.execute(`
            CREATE TABLE IF NOT EXISTS WalkRatings (
                rating_id INT AUTO_INCREMENT PRIMARY KEY,
                request_id INT NOT NULL,
                walker_id INT NOT NULL,
                owner_id INT NOT NULL,
                rating INT CHECK (rating BETWEEN 1 AND 5),
                comments TEXT,
                rated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (request_id) REFERENCES WalkRequests(request_id),
                FOREIGN KEY (walker_id) REFERENCES Users(user_id),
                FOREIGN KEY (owner_id) REFERENCES Users(user_id),
                CONSTRAINT unique_rating_per_walk UNIQUE (request_id)
            );
        `);

        // Insert data if table is empty
        const [rows1] = await db.execute('SELECT COUNT(*) AS count FROM Users');
        if (rows1[0].count === 0) {
            await db.execute(`
                INSERT INTO Users(username,email,password_hash,role) VALUES
                ('alice123','alice@example.com','hashed123','owner'),
                ('bobwalker','bob@example.com','hashed456','walker'),
                ('carol123','carol@example.com','hashed789','owner'),
                ('jiyan123','jiyan@example.com','jiyan123','owner'),
                ('jiyanwalker','jbwalk@example.com','jbwalk123','walker');
            `);
        }
        // // Insert data if table is empty
        const [rows2] = await db.execute('SELECT COUNT(*) AS count FROM Dogs');
        if (rows2[0].count === 0) {
            await db.execute(`
                INSERT INTO Dogs(owner_id,name,size) VALUES
                ((SELECT user_id FROM Users WHERE username = 'alice123'),'Max','medium'),
                ((SELECT user_id FROM Users WHERE username = 'carol123'),'Bella','small'),
                ((SELECT user_id FROM Users WHERE username = 'alice123'),'Rocko','large'),
                ((SELECT user_id FROM Users WHERE username = 'jiyan123'),'Dollar','large'),
                ((SELECT user_id FROM Users WHERE username = 'jiyan123'),'Visky','medium');
            `);
        }
        // Insert data if table is empty
        const [rows3] = await db.execute('SELECT COUNT(*) AS count FROM  WalkRequests');
        if (rows3[0].count === 0) {
            await db.execute(`
                INSERT INTO WalkRequests (dog_id,requested_time,duration_minutes,location,status) VALUES
                ((SELECT dog_id FROM Dogs WHERE name = 'Max'),'2025-06-10 08:00:00',30,'Parklands','open'),
                ((SELECT dog_id FROM Dogs WHERE name = 'Bella'),'2025-06-10 09:30:00',45,'Beachside Ave','accepted'),
                ((SELECT dog_id FROM Dogs WHERE name = 'Rocko'),'2025-06-13 12:30:00',25,'Salisbury Park','completed'),
                ((SELECT dog_id FROM Dogs WHERE name = 'Dollar'),'2025-06-15 08:30:00',55,'S8ul Gaming House','open'),
                ((SELECT dog_id FROM Dogs WHERE name = 'Visky'),'2025-06-15 08:30:00',55,'S8ul Gaming House','open');
            `);
        }
    } catch (err) {
        console.error('Error setting up database. Ensure Mysql is running: service mysql start', err);
    }
})();

app.get('/api/dogs',async (req,res,next) => {
    try{
        const [dogs] = await db.execute(`
            SELECT name AS dog_name,size,Users.username AS owner_username FROM Dogs
            JOIN Users ON Users.user_id = Dogs.owner_id
        `);
        res.json(dogs);
    }catch(error){
        res.status(500).json({ error: 'Failed to fetch Dogs' });
    }
});

app.get('/api/walkrequests/open',async (req,res,next) => {
    try{
        const [request] = await db.execute(`
            SELECT request_id,Dogs.name AS dog_name,requested_time,duration_minutes,location,Users.username AS owner_username FROM WalkRequests
            JOIN Dogs ON Dogs.dog_id = WalkRequests.dog_id
            JOIN Users ON Users.user_id = Dogs.owner_id
            WHERE WalkRequests.status = 'open'
        `);
        res.json(request);
    }catch(error){
        res.status(500).json({ error: 'Failed to fetch Requests' });
    }
});

app.get('/api/walkers/summary',async (req,res,next) => {
    try{
        const [summary] = await db.execute(`
            SELECT Users.username AS walker_username,COUNT(WalkRatings.rating_id) AS total_ratings,ROUND(AVG(WalkRatings.rating),1) AS average_rating,
            (SELECT COUNT(*) FROM WalkRequests JOIN WalkApplications ON WalkApplications.request_id = WalkRequests.request_id WHERE WalkRequests.status = 'completed' AND WalkApplications.walker_id = Users.user_id) AS completed_walks
            From Users
            LEFT JOIN WalkRatings ON WalkRatings.walker_id = Users.user_id
            WHERE Users.role = 'walker'
            GROUP BY Users.user_id;
        `);
        res.json(summary);
    }catch(error){
        res.status(500).json({ error: 'Failed to fetch Summary' });
    }
});

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
