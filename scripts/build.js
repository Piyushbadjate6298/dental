import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const isRender = Boolean(process.env.RENDER);
const isVercel = Boolean(process.env.VERCEL);
const args = process.argv.slice(2);
const buildFrontend = args.includes('--frontend') || (isVercel && !isRender);
const buildBackend = args.includes('--backend') || isRender;

console.log('🚀 Running build script for Shital Dental Services...');
console.log(`Environment detection: RENDER=${isRender}, VERCEL=${isVercel}`);

if (buildBackend || (!buildFrontend && !fs.existsSync(path.join(rootDir, 'frontend/node_modules/vite')))) {
  console.log('⚙️ Target: Backend Service (Render / Node.js API)');
  
  // 1. Run migrations if DATABASE_URL is available
  try {
    const migrateScript = path.join(rootDir, 'backend/scripts/migrate.js');
    if (fs.existsSync(migrateScript)) {
      console.log('🔄 Checking database migrations...');
      const res = spawnSync('node', ['scripts/migrate.js'], {
        cwd: path.join(rootDir, 'backend'),
        stdio: 'inherit',
        shell: false,
      });
      if (res.status !== 0) {
        console.warn('⚠️ Migration script exited with code', res.status);
      }
    }
  } catch (err) {
    console.warn('⚠️ Could not run build-time migrations:', err.message);
  }

  console.log('✅ Backend build completed successfully.');
  process.exit(0);
} else {
  console.log('⚙️ Target: Frontend UI (Vite / React)');
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  
  // Ensure frontend dependencies are installed if missing
  if (!fs.existsSync(path.join(rootDir, 'frontend/node_modules/vite'))) {
    console.log('📦 Installing frontend dependencies...');
    const installRes = spawnSync(npmCmd, ['install', '--prefix', 'frontend'], {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true,
    });
    if (installRes.status !== 0) {
      console.error('❌ Failed to install frontend dependencies.');
      process.exit(installRes.status || 1);
    }
  }

  console.log('🔨 Building frontend production assets...');
  const buildRes = spawnSync(npmCmd, ['run', 'build', '--prefix', 'frontend'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
  });

  if (buildRes.status !== 0) {
    console.error('❌ Frontend build failed.');
    process.exit(buildRes.status || 1);
  }

  console.log('✅ Frontend build completed successfully.');
  process.exit(0);
}
