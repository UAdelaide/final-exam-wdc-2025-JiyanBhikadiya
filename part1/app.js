var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mysql = require('mysql2/promise');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var apiRouter = require('./routes/api');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

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
        // Insert data if table is empty
        const [rows2] = await db.execute('SELECT COUNT(*) AS count FROM Dogs');
        if (rows2[0].count === 0) {
            await db.execute(`
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
                ((SELECT dog_id FROM Dogs WHERE name = 'Max' AND owner_id = (SELECT user_id FROM Users WHERE username = 'alice123')),'2025-06-10 08:00:00',30,'Parklands','open'),
                ((SELECT dog_id FROM Dogs WHERE name = 'Bella' AND owner_id = (SELECT user_id FROM Users WHERE username = 'carol123')),'2025-06-10 09:30:00',45,'Beachside Ave','accepted'),
                ((SELECT dog_id FROM Dogs WHERE name = 'Rocko' AND owner_id = (SELECT user_id FROM Users WHERE username = 'alice123')),'2025-06-13 12:30:00',25,'Salisbury Park','completed'),
                ((SELECT dog_id FROM Dogs WHERE name = 'Dollar' AND owner_id = (SELECT user_id FROM Users WHERE username = 'jiyan123')),'2025-06-15 08:30:00',55,'S8ul Gaming House','open'),
                ((SELECT dog_id FROM Dogs WHERE name = 'Visky' AND owner_id = (SELECT user_id FROM Users WHERE username = 'jiyan123')),'2025-06-15 08:30:00',55,'S8ul Gaming House','open');
            `);
        }
    } catch (err) {
        console.error('Error setting up database. Ensure Mysql is running: service mysql start', err);
    }
})();

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api',apiRouter);

module.exports = app;
