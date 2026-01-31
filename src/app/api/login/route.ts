import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../_lib/session";
import { storage } from "@server/storage";

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Local dev bootstrap login:
  // Ensure a *real* DB user exists (so foreign keys like created_by work) and ensure that
  // the admin has a storeId (required for store-scoped admin operations).
  if (
    process.env.NODE_ENV === "development" &&
    body.username === "admin" &&
    body.password === "admin123"
  ) {
    const session = await getSession();

    // Use existing DB user if present, otherwise create it (requires service role).
    let user = await storage.getUserByUsername("admin");
    if (!user) {
      user = await storage.createUser({
        username: "admin",
        password: "admin123",
        role: "admin",
        fullName: "Administrator (Dev)",
      } as any);
    }

    // Ensure this dev admin has a store assignment.
    if (!user.storeId) {
      const anyStorage = storage as any;

      // Prefer: store owned by this admin (owner_id = user.id)
      let store = (await anyStorage.getStoreByOwnerId?.(user.id)) as
        | { id: string; name: string }
        | undefined;

      // Otherwise: create a store for this admin (owner_id is unique)
      if (!store) {
        store = (await anyStorage.createStore?.({
          name: "Dev Store",
          ownerId: user.id,
        })) as { id: string; name: string };
      }

      if (store?.id) {
        await storage.updateUser(user.id, { storeId: store.id } as any);
        user = (await storage.getUser(user.id)) ?? user;
      }
    }

    session.user = user;
    await session.save();
    return NextResponse.json(session.user, { status: 200 });
  }

  // Fetch user from DB
  const user = await storage.getUserByUsername(body.username);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized - User not found" }, { status: 401 });
  }

  // Plain text password check (no hashing)
  if (user.password !== body.password) {
    return NextResponse.json({ message: "Unauthorized - Wrong password" }, { status: 401 });
  }

  // Save session
  const session = await getSession();
  session.user = user;
  await session.save();

  return NextResponse.json(user, { status: 200 });
}
