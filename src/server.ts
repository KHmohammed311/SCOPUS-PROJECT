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

/**
 * SCImago SJR proxy — avoids browser CORS.
 * Scopus returns ISSNs as "20411723" (no dash); SCImago expects "2041-1723".
 */
app.get('/api/sjr', async (req, res) => {
  const rawIssn = (req.query as Record<string, string>)['issn'];
  if (!rawIssn) {
    res.status(400).json({ error: 'Missing issn parameter' });
    return;
  }

  // Normalize: strip non-alphanumeric then insert dash after 4th char
  const clean = rawIssn.replace(/[^0-9Xx]/g, '');
  const issn = clean.length === 8 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : rawIssn;

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://www.scimagojr.com/',
  };

  try {
    const url = `https://www.scimagojr.com/journalsearch.php?q=${encodeURIComponent(issn)}&tip=issn&output=json`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      res.json([]); // treat as no data rather than error
      return;
    }

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      res.json(data);
    } catch {
      res.json([]); // HTML response = journal not found
    }
  } catch {
    res.json([]); // network failure — return empty so UI shows "non disponible"
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
