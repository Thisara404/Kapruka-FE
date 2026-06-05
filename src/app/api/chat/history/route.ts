import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  try {
    const db = await connectToDatabase();
    const collection = db.collection("conversations");
    const doc = await collection.findOne({ sessionId });

    if (doc) {
      return NextResponse.json({ messages: doc.messages || [] });
    }

    return NextResponse.json({ messages: [] });
  } catch (error) {
    console.error("[Chat History API] Error connecting to MongoDB, falling back to empty history:", error);
    return NextResponse.json({ messages: [], dbError: true });
  }
}
