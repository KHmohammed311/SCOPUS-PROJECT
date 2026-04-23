import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

const SCOPUS_API_KEY = 'd451936c59628276f68eb43266872213';

/**
 * Scopus Serial Title proxy — fetches journal quartile/CiteScore data by ISSN.
 * Uses view=CITESCORE to get per-year percentile → Q1/Q2/Q3/Q4.
 */
app.get('/api/journal-rank', async (req, res) => {
  const rawIssn = (req.query as Record<string, string>)['issn'];
  if (!rawIssn) { res.status(400).json({ error: 'Missing issn' }); return; }

  // Normalize ISSN: ensure dash is present (Scopus returns "1087-0156" format)
  const digits = rawIssn.replace(/[^0-9Xx]/g, '');
  const issn = digits.length === 8 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : rawIssn;

  try {
    const url = `https://api.elsevier.com/content/serial/title/issn/${encodeURIComponent(issn)}?view=CITESCORE&apiKey=${SCOPUS_API_KEY}`;
    const response = await fetch(url, {
      headers: { 'X-ELS-APIKey': SCOPUS_API_KEY, 'Accept': 'application/json' },
    });
    if (!response.ok) { res.json(null); return; }
    const data = await response.json();
    res.json(data);
  } catch {
    res.json(null);
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
