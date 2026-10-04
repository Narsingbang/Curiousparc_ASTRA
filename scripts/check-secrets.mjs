import fs from 'fs';
import path from 'path';

const distDir = path.resolve(process.cwd(), 'client/dist');

console.log('🔒 Checking client bundle for accidental secret leaks...');

if (!fs.existsSync(distDir)) {
  console.log('⚠️  client/dist does not exist yet (run build first). Secret check passed for now.');
  process.exit(0);
}

function scanDirectory(dir) {
  let hasLeak = false;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (scanDirectory(fullPath)) hasLeak = true;
    } else if (file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.css')) {
      const content = fs.readFileSync(fullPath, 'utf8');

      // Check for forbidden secret patterns
      const forbiddenTokens = [
        'SUPABASE_SERVICE_ROLE_KEY',
        'service_role',
        'GEMINI_API_KEY',
        'AIzaSy', // Standard Google API Key prefix
      ];

      for (const token of forbiddenTokens) {
        if (content.includes(token)) {
          console.error(`❌ SECURITY ALERT: Potential secret leak of "${token}" detected in ${fullPath}!`);
          hasLeak = true;
        }
      }
    }
  }

  return hasLeak;
}

const leakFound = scanDirectory(distDir);

if (leakFound) {
  console.error('❌ Build failed: Secrets detected in client bundle!');
  process.exit(1);
} else {
  console.log('✅ Secret check passed: client/dist is clean of server secrets.');
  process.exit(0);
}
