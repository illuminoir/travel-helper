import mysql from "mysql2/promise";

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

console.log(process.env)

pool.query("SELECT 1")
    .then(() => console.log("✅ Connected to MySQL!"))
    .catch(err => console.error("❌ MySQL connection failed:", err));

export default pool;