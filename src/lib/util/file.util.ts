import * as fs from 'fs/promises';
import * as path from 'path';

export class FileUtil {
  // Reads and parses a JSON file from disk
  public static async readJson(filePath: string): Promise<Record<string, unknown>> {
    const absPath = path.resolve(process.cwd(), filePath);
    const content = await fs.readFile(absPath, 'utf8');
    return JSON.parse(content) as Record<string, unknown>;
  }

  // Writes an object as pretty JSON to disk
  public static async writeJson(filePath: string, data: Record<string, unknown>): Promise<void> {
    const absPath = path.resolve(process.cwd(), filePath);
    await fs.writeFile(absPath, JSON.stringify(data, null, 2), 'utf8');
  }
}
