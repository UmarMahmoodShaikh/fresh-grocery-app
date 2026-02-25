const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        if (fs.statSync(dirPath).isDirectory()) walkDir(dirPath, callback);
        else callback(dirPath);
    });
}

const fixSafeAreaView = () => {
    walkDir('app', (filePath) => {
        if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
            let content = fs.readFileSync(filePath, 'utf8');

            // If the file imports SafeAreaView from "react-native" or 'react-native'
            // We will remove SafeAreaView from the react-native import, and add import { SafeAreaView } from "react-native-safe-area-context"
            let originalContent = content;

            // Match the multiline or inline import from react-native
            // E.g. import { View, SafeAreaView, Text } from 'react-native';
            const rnImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]react-native['"];?/g;

            content = content.replace(rnImportRegex, (match, imports) => {
                if (imports.includes('SafeAreaView')) {
                    // Remove SafeAreaView from the list
                    let newImports = imports.split(',').map(i => i.trim()).filter(i => i !== 'SafeAreaView' && i !== '');

                    let replacement = '';
                    if (newImports.length > 0) {
                        replacement += `import {\n  ${newImports.join(',\n  ')}\n} from "react-native";\n`;
                    }
                    // Don't add if already imported
                    return replacement;
                }
                return match;
            });

            if (originalContent !== content) {
                if (!content.includes('react-native-safe-area-context')) {
                    content = `import { SafeAreaView } from "react-native-safe-area-context";\n` + content;
                }
                fs.writeFileSync(filePath, content, 'utf8');
                console.log("Fixed:", filePath);
            }
        }
    });
};

fixSafeAreaView();
