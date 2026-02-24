const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
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
    let finalContent = content
        .replace(/backgroundcolor:/g, 'backgroundColor:')
        .replace(/borderBottomcolor:/g, 'borderBottomColor:');

    // Also fix getStyles not defined
    if (file.includes('app/index.tsx') || file.includes('app/(auth)/index.tsx') || file.includes('app/(admin)/_layout.tsx')) {
        if (finalContent.includes('const getStyles = (isDark: boolean) => StyleSheet.create({')) {
            // Already there
        } else if (finalContent.includes('const styles = StyleSheet.create({')) {
            finalContent = finalContent.replace('const styles = StyleSheet.create({', 'const getStyles = (isDark: boolean) => StyleSheet.create({');
        } else if (!finalContent.includes('const getStyles')) {
            // add dummy getStyles if it doesn't exist
            finalContent += '\nconst getStyles = (isDark: boolean) => StyleSheet.create({});\n';
        }
    }

    if (content !== finalContent) {
        fs.writeFileSync(file, finalContent, 'utf8');
        console.log('Fixed syntax typos in:', file);
    }
});
