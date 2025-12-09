import { MongoClient, Db } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

/**
 * Kết nối đến MongoDB
 */
export async function connectToDatabase(): Promise<Db> {
    if (db) {
        return db;
    }

    const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
    const DATABASE_NAME = process.env.DATABASE_NAME || "contentcore";

    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db(DATABASE_NAME);

        console.log(`✅ Connected to MongoDB: ${DATABASE_NAME}`);
        return db;
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        throw error;
    }
}

/**
 * Lấy database instance
 */
export function getDatabase(): Db {
    if (!db) {
        throw new Error("Database not initialized. Call connectToDatabase() first.");
    }
    return db;
}

/**
 * Đóng kết nối database
 */
export async function closeDatabase(): Promise<void> {
    if (client) {
        await client.close();
        client = null;
        db = null;
        console.log("✅ MongoDB connection closed");
    }
}
