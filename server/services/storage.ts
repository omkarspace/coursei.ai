import { v2 as cloudinary } from "cloudinary";
import path from "path";

// ===== Storage Adapter Interface =====
export interface StorageAdapter {
  upload(file: Buffer, path: string, contentType?: string): Promise<string>;
  delete(path: string): Promise<void>;
  getPublicUrl(path: string): string;
}

// ===== Cloudinary Implementation =====
class CloudinaryStorage implements StorageAdapter {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async upload(file: Buffer, filePath: string, contentType?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          public_id: filePath,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result?.secure_url || "");
        }
      ).end(file);
    });
  }

  async delete(filePath: string): Promise<void> {
    await cloudinary.uploader.destroy(filePath);
  }

  getPublicUrl(filePath: string): string {
    return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${filePath}`;
  }
}

// ===== Local Filesystem Implementation =====
class LocalStorage implements StorageAdapter {
  private uploadDir: string;

  constructor() {
    this.uploadDir = process.env.LOCAL_STORAGE_DIR || "./public/uploads";
  }

  async upload(file: Buffer, filePath: string, contentType?: string): Promise<string> {
    const fs = await import("fs/promises");
    const fullPath = `${this.uploadDir}/${filePath}`;
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, file);
    return `/uploads/${filePath}`;
  }

  async delete(filePath: string): Promise<void> {
    const fs = await import("fs/promises");
    await fs.unlink(`${this.uploadDir}/${filePath}`);
  }

  getPublicUrl(filePath: string): string {
    return `/uploads/${filePath}`;
  }
}

// ===== Factory Function =====
export function getStorage(): StorageAdapter {
  const provider = process.env.STORAGE_PROVIDER || "local";

  switch (provider) {
    case "cloudinary":
      if (!process.env.CLOUDINARY_CLOUD_NAME) {
        console.warn("Missing Cloudinary env vars, falling back to local storage");
        return new LocalStorage();
      }
      return new CloudinaryStorage();
    case "local":
    default:
      return new LocalStorage();
  }
}

// ===== Convenience Export =====
export const storage = getStorage();
