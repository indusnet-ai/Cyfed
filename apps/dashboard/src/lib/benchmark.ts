import fs from 'fs';

export function getSafeBenchmarkData(filePath: string): any {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  // Replace unquoted NaN, Infinity, -Infinity with null
  const sanitizedContent = fileContent
    .replace(/\bNaN\b/g, 'null')
    .replace(/\bInfinity\b/g, 'null')
    .replace(/\b-Infinity\b/g, 'null');
  
  return JSON.parse(sanitizedContent);
}
