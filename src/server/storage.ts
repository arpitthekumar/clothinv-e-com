export type { IStorage } from "./storage/interface";
import { SupabaseStorage } from "./storage/storage.service";

export const storage = new SupabaseStorage();
