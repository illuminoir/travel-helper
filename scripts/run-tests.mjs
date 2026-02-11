import { execSync } from 'child_process';

try {
  const output = execSync('npx vitest run', {
    cwd: '/vercel/share/v0-project/client-next',
    encoding: 'utf-8',
    stdio: 'pipe',
    timeout: 60000,
  });
  console.log(output);
} catch (err) {
  console.log(err.stdout || '');
  console.error(err.stderr || '');
  process.exit(1);
}
