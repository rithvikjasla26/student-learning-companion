import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const distPath = path.join(__dirname, 'dist');
const indexPath = path.join(distPath, 'index.html');

// Check if dist folder exists
if (!fs.existsSync(distPath)) {
  console.error(`❌ Error: dist folder not found at ${distPath}`);
  console.error('Available files:', fs.readdirSync(__dirname));
  process.exit(1);
}

console.log(`✅ Serving files from: ${distPath}`);

// Serve static files from dist
app.use(express.static(distPath));

// SPA fallback - serve index.html for all non-file routes
app.get('*', (req, res) => {
  console.log(`Routing ${req.path} to index.html`);
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error(`❌ index.html not found at ${indexPath}`);
    res.status(404).send('index.html not found');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Frontend server listening on 0.0.0.0:${PORT}`);
});
