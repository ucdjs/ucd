export function createReportsIndexHtml(): string {
  return `
    <!doctype html>
    <html>
      <body>
        <a href="/reports/tr9/">UAX #9</a>
        <a href="https://www.unicode.org/reports/tr44/">UAX #44</a>
      </body>
    </html>
  `;
}

export function createReportHtml({
  reportId,
  title,
  currentRevision,
  previousRevision,
  includeProposed = false,
}: {
  reportId: string;
  title: string;
  currentRevision: number;
  previousRevision?: number;
  includeProposed?: boolean;
}): string {
  return `
    <!doctype html>
    <html>
      <head>
        <title>${title}</title>
      </head>
      <body>
        <h1>${title}</h1>
        <p>This Version <a href="https://www.unicode.org/reports/${reportId}/${reportId}-${currentRevision}.html">${reportId}-${currentRevision}</a></p>
        ${previousRevision == null ? "" : `<p>Previous Version <a href="https://www.unicode.org/reports/${reportId}/${reportId}-${previousRevision}.html">${reportId}-${previousRevision}</a></p>`}
        ${includeProposed ? `<p>Latest Proposed Update <a href="https://www.unicode.org/reports/${reportId}/proposed.html">proposed</a></p>` : ""}
        <p>Revision ${currentRevision}</p>
      </body>
    </html>
  `;
}
