const fs = require('fs');
const path = require('path');

function checkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      checkDir(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const imports = content.match(/from\s+['\"](\.\/[^'\"]+|\.\.\/[^'\"]+)['\"]/g) || [];
      for (const imp of imports) {
        const importPath = imp.match(/['\"]([^'\"]+)['\"]/)[1];
        if (importPath.startsWith('.')) {
          // Resolve path
          const targetPathBase = path.resolve(dir, importPath);
          // Check if file exists exactly
          const exts = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js'];
          let foundExact = false;
          let foundInsensitive = false;
          let actualName = null;

          for (const ext of exts) {
            const p = targetPathBase + ext;
            if (fs.existsSync(p)) {
              foundInsensitive = true;
              // Check exact case
              const dirName = path.dirname(p);
              const baseName = path.basename(p);
              try {
                const actualFiles = fs.readdirSync(dirName);
                if (actualFiles.includes(baseName)) {
                  foundExact = true;
                  break;
                } else {
                  // find actual
                  actualName = actualFiles.find(f => f.toLowerCase() === baseName.toLowerCase());
                }
              } catch (e) {}
            }
          }
          if (foundInsensitive && !foundExact) {
            console.log('Case mismatch in ' + fullPath + ': imported ' + importPath + ' but actual file is ' + actualName);
          }
        }
      }
    }
  }
}
checkDir('src');
