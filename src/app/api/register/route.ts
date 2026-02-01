import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { getSession } from "../_lib/session";
import { insertUserSchema } from "@shared/schema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Parse only the public fields (role/storeId are not accepted from public registration)
    const data = insertUserSchema.pick({ username: true, password: true, fullName: true }).parse(body);

    // Force public registrations to be customers and disallow store/admin assignment
    const payload = {
      username: data.username,
      password: data.password,
      fullName: data.fullName,
      role: "customer" as const,
    };

    // Check for existing username
    const existing = await storage.getUserByUsername(payload.username);
    if (existing) {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 });
    }

    const user = await storage.createUser(payload as any);

    // Create a linked customer record (optional) so checkout/sales can reference a customer profile
    try {
      await storage.createCustomer({ userId: user.id, name: user.fullName });
    } catch (err) {
      // Non-fatal: log but continue (customer profile is optional)
      console.warn("Failed to create linked customer profile:", err);
    }

    // Create session for newly registered user
    const session = await getSession();
    session.user = user as any;
    await session.save();

    return NextResponse.json(user, { status: 201 });
  } catch (err: any) {
    console.error("Registration error:", err);
    // Detect DB permission issues and return a clearer message
    if (err?.message?.toLowerCase()?.includes("permission denied") || err?.message?.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return NextResponse.json({ error: "Server DB permission denied. Ensure SUPABASE_SERVICE_ROLE_KEY is set in .env.local and restart the dev server." }, { status: 500 });
    }
    return NextResponse.json({ error: err?.message ?? "Invalid user data" }, { status: 400 });
  }
}


