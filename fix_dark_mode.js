const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('app');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Skip files that shouldn't be auto-transformed
  if (file.includes('account.tsx') || file.includes('modal.tsx') || file.includes('explore.tsx') || file.includes('_layout.tsx') || file.includes('+not-found.tsx') || file.includes('Scanner')) {
    return;
  }

  let finalContent = content;

  // Change StyleSheet.create
  if (finalContent.includes('const styles = StyleSheet.create({')) {
     finalContent = finalContent.replace('const styles = StyleSheet.create(', 'const getStyles = (isDark: boolean) => StyleSheet.create(');
  } else {
     return; // Skip files without StyleSheet.create
  }

  // Add the import if missing
  if (!finalContent.includes('useColorScheme')) {
    if (finalContent.includes("from 'react-native'") || finalContent.includes('from "react-native"')) {
      finalContent = finalContent.replace(/(import\s+{[^}]*)(\}\s+from\s+["']react-native["'])/, 
      (match, p1, p2) => {
          if (p1.includes('useColorScheme')) return match;
          return p1 + ", useColorScheme " + p2;
      });
    } else {
        finalContent = "import { useColorScheme } from 'react-native';\n" + finalContent;
    }
  }

  // Add isDark and call getStyles inside component
  const componentMatch = finalContent.match(/export default function\s+([A-Za-z0-9_]+)\([^)]*\)\s*{/);
  if (componentMatch) {
    if(!finalContent.includes('const isDark =')) {
        finalContent = finalContent.replace(componentMatch[0], componentMatch[0] + "\n  const isDark = useColorScheme() === 'dark';\n  const styles = getStyles(isDark);\n");
    }
  } else {
    // try to match const Component =
    const componentArrowMatch = finalContent.match(/export default const ([A-Za-z0-9_]+) = \([^)]*\) =>\s*{/);
    if(componentArrowMatch && !finalContent.includes('const isDark =')) {
        finalContent = finalContent.replace(componentArrowMatch[0], componentArrowMatch[0] + "\n  const isDark = useColorScheme() === 'dark';\n  const styles = getStyles(isDark);\n");
    }
  }

  // Replace colors inside the file
  const replacements = [
    { from: /backgroundColor:\s*["']#ffffff["']/gi, to: 'backgroundColor: isDark ? "#1F2937" : "#ffffff"' },
    { from: /backgroundColor:\s*["']#fff["']/gi, to: 'backgroundColor: isDark ? "#1F2937" : "#fff"' },
    { from: /backgroundColor:\s*["']#F9FAFB["']/gi, to: 'backgroundColor: isDark ? "#111827" : "#F9FAFB"' },
    { from: /backgroundColor:\s*["']#f3f4f6["']/gi, to: 'backgroundColor: isDark ? "#111827" : "#f3f4f6"' },
    { from: /backgroundColor:\s*["']#E5E7EB["']/gi, to: 'backgroundColor: isDark ? "#374151" : "#E5E7EB"' },
    
    // Explicitly target color properties in styles
    { from: /color:\s*["']#1F2937["']/gi, to: 'color: isDark ? "#F9FAFB" : "#1F2937"' },
    { from: /color:\s*["']#111827["']/gi, to: 'color: isDark ? "#F9FAFB" : "#111827"' },
    { from: /color:\s*["']#374151["']/gi, to: 'color: isDark ? "#D1D5DB" : "#374151"' },
    { from: /color:\s*["']#4B5563["']/gi, to: 'color: isDark ? "#D1D5DB" : "#4B5563"' },
    { from: /color:\s*["']#6B7280["']/gi, to: 'color: isDark ? "#9CA3AF" : "#6B7280"' },
    { from: /color:\s*["']#9CA3AF["']/gi, to: 'color: isDark ? "#D1D5DB" : "#9CA3AF"' },
    { from: /color:\s*["']#000["']/gi, to: 'color: isDark ? "#F9FAFB" : "#000"' },
    { from: /color:\s*["']#000000["']/gi, to: 'color: isDark ? "#F9FAFB" : "#000000"' },

    { from: /borderColor:\s*["']#F3F4F6["']/gi, to: 'borderColor: isDark ? "#374151" : "#F3F4F6"' },
    { from: /borderColor:\s*["']#E5E7EB["']/gi, to: 'borderColor: isDark ? "#374151" : "#E5E7EB"' },
    
    { from: /borderBottomColor:\s*["']#F3F4F6["']/gi, to: 'borderBottomColor: isDark ? "#374151" : "#F3F4F6"' },
    { from: /borderBottomColor:\s*["']#E5E7EB["']/gi, to: 'borderBottomColor: isDark ? "#374151" : "#E5E7EB"' }
  ];

  replacements.forEach(r => {
      finalContent = finalContent.replace(r.from, r.to);
  });

  if (content !== finalContent) {
      fs.writeFileSync(file, finalContent, 'utf8');
      console.log('Fixed dark mode in:', file);
  }
});

console.log("Dark mode injection complete.");
