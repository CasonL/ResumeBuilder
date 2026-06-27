export function extractCompanyName(jobDescription: string): string | null {
  const firstLine = jobDescription.split('\n').find(line => line.trim().length > 0);
  if (!firstLine) return null;

  const match = firstLine.match(/^([A-Z][A-Za-z0-9&.\s]+?)(?:\s+(?:is|are|was|were|has|have|does|do|—|-|\||:|,|\.|\n|\())/i);
  if (match) {
    const name = match[1].trim();
    if (name.length >= 2) return name;
  }

  const firstWord = firstLine.trim().split(/\s+/)[0];
  if (firstWord && firstWord[0] === firstWord[0].toUpperCase() && firstWord.length >= 2) {
    return firstWord;
  }

  return null;
}

export function sanitizeCompanyName<T>(data: T, companyName: string | null): T {
  if (!companyName || companyName.length < 2) return data;

  const escaped = companyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'gi');

  const stringified = JSON.stringify(data);
  const sanitized = stringified.replace(regex, '');
  return JSON.parse(sanitized) as T;
}
