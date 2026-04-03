---
name: rera-compliance
description: How to handle RERA verification correctly in Grey Advisor. Use this skill whenever implementing or modifying the RERA check feature. Contains legal guardrails to prevent displaying fabricated RERA IDs as genuine.
---

# RERA Compliance — Grey Advisor

## Legal Status
Displaying fabricated RERA Registration Numbers as genuine is a legal risk under:
- **RERA Act Section 3**: Only registered projects may claim RERA status
- **Consumer Protection Act 2019**: Misleading representation of property data
- **SEBI guidelines** (if investment advice is implied)

## Acceptable Approaches (Use These)

### 1. Illustrative IDs with Disclaimer (Current Approach — Safe)
The AI generates plausible-format RERA IDs (P52000XXXXX) tagged with:
```json
{
  "reraId": "P52000XXXXX",
  "reraDisclaimer": "Illustrative ID only — verify on official RERA portal before investing."
}
```
In the UI, display this with a warning icon `⚠️` not a tick `✓`.

### 2. Real-Time Scraping via Firecrawl (Ideal — Not Yet Implemented)
Scrape official state RERA portals to get real registration status:
```
Maharashtra:  https://maharera.maharashtra.gov.in/
Karnataka:    https://rera.karnataka.gov.in/
Telangana:    https://rera.telangana.gov.in/
Delhi:        https://rera.delhi.gov.in/
UP:           https://www.up-rera.in/
Gujarat:      https://gujrera.gujarat.gov.in/
Rajasthan:    https://rera.rajasthan.gov.in/
```

### 3. Deep Link to Official Portal (Safe + Always Correct)
```tsx
<a
  href={`https://maharera.maharashtra.gov.in/SearchProject?ProjectName=${encodeURIComponent(builderName)}`}
  target="_blank"
  rel="noopener noreferrer"
  className="text-amber-700 underline text-xs"
>
  Verify on MahaRERA ↗
</a>
```

## RERA ID Format Reference
| State | Format | Example |
|---|---|---|
| Maharashtra | P[CountyCode(2)][DistrictCode(2)][Year(2)][ProjectCode(6)] | P52000023012345 |
| Karnataka | PRM/KA/RERA/[Year]/[Number] | PRM/KA/RERA/2023/007 |
| Telangana | P02[DistrictCode(2)][Year(2)][ProjectCode(6)] | P0201230001234 |
| Haryana | RC/REP/HARERA/GGM/[year]/[number] | RC/REP/HARERA/GGM/2023/123 |
| Rajasthan | RAJ/P/[City]/[Year]/[Number] | RAJ/P/JPR/2023/0001 |

## UI Implementation
```tsx
function ReraStatus({ reraId, disclaimer }: { reraId?: string; disclaimer?: string }) {
  if (!reraId) return null;
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {disclaimer ? (
        <>
          <span className="text-amber-500 font-medium">⚠️ RERA (Illustrative)</span>
          <span className="text-stone-400">— </span>
          <a className="text-amber-600 underline" href="https://maharera.maharashtra.gov.in" target="_blank">Verify ↗</a>
        </>
      ) : (
        <>
          <span className="text-emerald-600 font-semibold">✓ RERA</span>
          <span className="text-stone-500 font-mono">{reraId}</span>
        </>
      )}
    </div>
  );
}
```

## Rules
- NEVER show a checkmark ✓ next to an illustrative RERA ID — it's misleading
- ALWAYS include deep link to official portal for any RERA reference
- When scraping is implemented: cache real RERA status for 7 days (rarely changes post-registration)
- For unregistered projects: show "RERA Not Available — verify before investing" in red
- The `/api/rera-check` route MUST include this disclaimer in every response
