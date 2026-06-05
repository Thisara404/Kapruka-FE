import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URL as string;

if (!uri) {
  throw new Error("Please add your MONGODB_URL to .env.local");
}

const options = {};

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

/**
 * Get or create the shared MongoClient promise, connecting lazily.
 */
export async function getMongoClientPromise(): Promise<MongoClient> {
  if (clientPromise) {
    return clientPromise;
  }

  if (process.env.NODE_ENV === "development") {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    // In production mode, connect lazily when requested.
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }

  return clientPromise;
}

/**
 * Connect to the MongoDB database and return the Db instance.
 */
export async function connectToDatabase(): Promise<Db> {
  const mongoClient = await getMongoClientPromise();
  // Use 'thisari_db' or default database from URI connection string
  return mongoClient.db("thisari_db");
}
