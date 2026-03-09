export async function processHindsightChecks(): Promise<number> {
  const res = await fetch("/api/hindsight", { method: "POST" });
  if (!res.ok) return 0;
  const data = await res.json();
  return data.processed ?? 0;
}
