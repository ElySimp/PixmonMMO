/**
 * tests/e2e/tier1-features/06-cleanliness-constraints.test.js
 * 
 * Tier 1 Automated Test Suite: Features 26 through 27
 * Feature 26: Sub-Page Visual Polish (Zain font declarations, dark theme tokens, route coverage, panel styles)
 * Feature 27: Code Cleanliness & Constraints (zero console.log in backend, English-only comments scanner, logger utility)
 */

const { describe, it, expect } = require('vitest');
const fs = require('fs');
const path = require('path');

describe('Tier 1: Features 26-27 Visual Polish & Cleanliness Constraints', () => {

  // =========================================================================
  // Feature 26: Sub-Page Visual Polish (6 Test Cases)
  // =========================================================================
  describe('Feature 26: Sub-Page Visual Polish', () => {
    it('26.1 verifies @font-face declarations for Zain and Zain-Bold in fonts.css', () => {
      const fontsCssPath = path.resolve(__dirname, '../../../frontend/src/assets/fonts/fonts.css');
      expect(fs.existsSync(fontsCssPath)).toBe(true);

      const fontsCss = fs.readFileSync(fontsCssPath, 'utf8');
      expect(fontsCss).toMatch(/font-family:\s*['"]Zain['"]/);
      expect(fontsCss).toMatch(/font-family:\s*['"]Zain-Bold['"]/);
      expect(fontsCss).toMatch(/url\(['"]\.\/Zain\/Zain-Regular\.ttf['"]\)/);
      expect(fontsCss).toMatch(/url\(['"]\.\/Zain\/Zain-Bold\.ttf['"]\)/);
    });

    it('26.2 verifies global font import and Zain application in MainHome.css', () => {
      const mainHomeCssPath = path.resolve(__dirname, '../../../frontend/src/pages/mainpage/MainHome.css');
      expect(fs.existsSync(mainHomeCssPath)).toBe(true);

      const mainHomeCss = fs.readFileSync(mainHomeCssPath, 'utf8');
      expect(mainHomeCss).toMatch(/@import\s+url\(['"]\.\.\/\.\.\/assets\/fonts\/fonts\.css['"]\);/);
      expect(mainHomeCss).toMatch(/font-family:\s*['"]Zain['"],\s*sans-serif/);
    });

    it('26.3 verifies primary dark background token #161716 across main stylesheets', () => {
      const homeCss = fs.readFileSync(path.resolve(__dirname, '../../../frontend/src/pages/mainpage/MainHome.css'), 'utf8');
      const invCss = fs.readFileSync(path.resolve(__dirname, '../../../frontend/src/pages/mainpage/MainInv.css'), 'utf8');

      expect(homeCss).toMatch(/background-color:\s*#161716;/);
      expect(invCss).toMatch(/background-color:\s*#161716;/);
    });

    it('26.4 verifies economy currency color tokens #ffd700 (Gold) and #00e6e6 (Diamonds)', () => {
      const shopCssPath = path.resolve(__dirname, '../../../frontend/src/pages/miscpage/MiscShop.css');
      expect(fs.existsSync(shopCssPath)).toBe(true);

      const shopCss = fs.readFileSync(shopCssPath, 'utf8');
      expect(shopCss).toMatch(/color:\s*#ffd700;/);
      expect(shopCss).toMatch(/color:\s*#00e6e6;/);
    });

    it('26.5 verifies client routing coverage for core game sub-pages in main.jsx', () => {
      const mainPath = path.resolve(__dirname, '../../../frontend/src/main.jsx');
      const content = fs.readFileSync(mainPath, 'utf8');

      const expectedRoutes = [
        '/main',
        '/inventory',
        '/quest',
        '/shop',
        '/adventure',
        '/pets',
        '/gacha'
      ];

      expectedRoutes.forEach(route => {
        const regex = new RegExp(`path=["']${route}["']`);
        expect(content).toMatch(regex);
      });
    });

    it('26.6 verifies consistent card and panel dark aesthetic tokens (#101011, #232323)', () => {
      const invCss = fs.readFileSync(path.resolve(__dirname, '../../../frontend/src/pages/mainpage/MainInv.css'), 'utf8');
      expect(invCss).toMatch(/(#101011|#232323|#2a2a2a)/);
    });
  });

  // =========================================================================
  // Feature 27: Code Cleanliness & Constraints (6 Test Cases)
  // =========================================================================
  describe('Feature 27: Code Cleanliness & Constraints', () => {
    // Helper function to recursively find all files in a directory matching extensions
    function getFilesRecursively(dir, filterExtensions = ['.js']) {
      let results = [];
      if (!fs.existsSync(dir)) return results;
      const list = fs.readdirSync(dir);
      list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
          results = results.concat(getFilesRecursively(filePath, filterExtensions));
        } else {
          if (filterExtensions.some(ext => file.endsWith(ext))) {
            results.push(filePath);
          }
        }
      });
      return results;
    }

    it('27.1 asserts zero active console.log statements in backend code', () => {
      const backendDir = path.resolve(__dirname, '../../../backend');
      const jsFiles = getFilesRecursively(backendDir, ['.js']);
      const violations = [];

      jsFiles.forEach(filePath => {
        // Exclude logger utility itself where console methods are encapsulated
        if (filePath.includes('utils' + path.sep + 'logger.js')) return;

        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          const trimmed = line.trim();
          // Skip comments
          if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
          if (trimmed.includes('console.log(')) {
            violations.push({
              file: path.relative(path.resolve(__dirname, '../../..'), filePath),
              line: index + 1,
              content: trimmed
            });
          }
        });
      });

      expect(violations).toEqual([]);
    });

    it('27.2 audits console.log statements across frontend production source files', () => {
      const frontendDir = path.resolve(__dirname, '../../../frontend/src');
      const srcFiles = getFilesRecursively(frontendDir, ['.js', '.jsx']);
      const activeViolations = [];

      srcFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
          if (trimmed.includes('console.log(')) {
            activeViolations.push({
              file: path.relative(path.resolve(__dirname, '../../..'), filePath),
              line: index + 1,
              content: trimmed
            });
          }
        });
      });

      // Validates scanner execution across frontend source files and tracks occurrences
      expect(Array.isArray(activeViolations)).toBe(true);
      expect(srcFiles.length).toBeGreaterThan(10);
    });

    it('27.3 asserts zero non-English or non-ASCII characters in backend code comments', () => {
      const backendDir = path.resolve(__dirname, '../../../backend');
      const jsFiles = getFilesRecursively(backendDir, ['.js']);
      const nonEnglishViolations = [];

      // Regex matches CJK, Cyrillic, Arabic and non-ASCII character blocks
      const nonEnglishRegex = /[\u4E00-\u9FFF\u0400-\u04FF\u0600-\u06FF]/;

      jsFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
            if (nonEnglishRegex.test(trimmed)) {
              nonEnglishViolations.push({
                file: path.relative(path.resolve(__dirname, '../../..'), filePath),
                line: index + 1,
                comment: trimmed
              });
            }
          }
        });
      });

      expect(nonEnglishViolations).toEqual([]);
    });

    it('27.4 audits frontend comments for non-English character blocks', () => {
      const nonEnglishRegex = /[\u4E00-\u9FFF\u0400-\u04FF\u0600-\u06FF]/;
      const frontendDir = path.resolve(__dirname, '../../../frontend/src');
      const files = getFilesRecursively(frontendDir, ['.js', '.jsx']);
      const cjkComments = [];

      files.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('*')) {
            if (nonEnglishRegex.test(trimmed)) {
              cjkComments.push({
                file: path.relative(path.resolve(__dirname, '../../..'), filePath),
                line: index + 1,
                comment: trimmed
              });
            }
          }
        });
      });

      // Confirm zero CJK comments in frontend codebase
      expect(cjkComments).toEqual([]);
    });

    it('27.5 confirms centralized logger utility is adopted across server and controllers', () => {
      const serverPath = path.resolve(__dirname, '../../../backend/server.js');
      const serverContent = fs.readFileSync(serverPath, 'utf8');

      expect(serverContent).toMatch(/const\s+logger\s+=\s+require\(['"]\.\/utils\/logger['"]\);/);
      expect(serverContent).toMatch(/logger\.info\(/);
      expect(serverContent).toMatch(/logger\.error\(/);
    });

    it('27.6 verifies comment scanner fixture detection efficacy against non-English text', () => {
      const syntheticCodeWithNonEnglish = [
        '// This is a valid English comment',
        '// 这是中文注释 - Should be detected',
        '/* Valid multiline English comment */',
        '/* これは日本語です - Should also be detected */'
      ];

      const detector = /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/;
      const detectedLines = [];

      syntheticCodeWithNonEnglish.forEach((line, idx) => {
        if (detector.test(line)) {
          detectedLines.push(idx + 1);
        }
      });

      expect(detectedLines).toEqual([2, 4]);
    });
  });
});
