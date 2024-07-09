
import pg from "pg";

// Database configuration
const db_config = {
    user: "postgres",
    host: "localhost",
    database: "njit",
    password: "Password@23",
    port: 5432,
};

// Funtion to get data from the database
export async function getDatabaseData(sql_query) {
    let db = new pg.Client(db_config);
    try {
        await db.connect();
        const result = await db.query(sql_query);
        return result.rows;
    } catch (err) {
        console.error("Error executing query", err);
    } finally {
        await db.end();
    }
}