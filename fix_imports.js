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

  // Fix:  View,\n, useColorScheme }
  let finalContent = content.replace(/,\s*\n\s*,\s*useColorScheme\s*}/g, ',\n    useColorScheme\n}');
  
  // Fix: View \n , useColorScheme } 
  finalContent = finalContent.replace(/([A-Za-z0-9_]+)\s*\n\s*,\s*useColorScheme\s*}/g, '$1,\n    useColorScheme\n}');

  // General fallback for single line syntax: View , useColorScheme }
  finalContent = finalContent.replace(/([A-Za-z0-9_]+)\s+,\s*useColorScheme\s*}/g, '$1,\n    useColorScheme\n}');

  // And this case: View ,  useColorScheme} => View, useColorScheme}
  finalContent = finalContent.replace(/,\s*,\s*useColorScheme\s*}/g, ',\n    useColorScheme\n}');

  
  if (content !== finalContent) {
      fs.writeFileSync(file, finalContent, 'utf8');
      console.log('Fixed imports in:', file);
  }
});
