export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>
          Estimates only — not financial or tax advice. Rules verified
          against GOV.UK for 2025/26 and 2026/27.
        </p>
        <p className="flex gap-4">
          <a href="/openapi.json" target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-foreground">
            OpenAPI spec
          </a>
          <a href="/scalar" target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-foreground">
            API reference
          </a>
        </p>
      </div>
    </footer>
  );
}
