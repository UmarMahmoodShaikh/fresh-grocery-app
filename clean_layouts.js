const fs = require('fs');

const filesToClean = [
    'app/index.tsx',
    'app/(auth)/index.tsx',
    'app/(admin)/_layout.tsx'
];

filesToClean.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');

        // Remove trailing empty getStyles
        content = content.replace(/\nconst getStyles = \(isDark: boolean\) => StyleSheet\.create\({}\);\n/g, '\n');

        // Remove styles hooks in these generic redirects
        if (file !== 'app/(admin)/_layout.tsx') {
            content = content.replace(/import { useColorScheme } from 'react-native';\n/, '');
            content = content.replace(/  const isDark = useColorScheme\(\) === 'dark';\n/, '');
            content = content.replace(/  const styles = getStyles\(isDark\);\n\n/, '');
        }

        // Fix casing typo in admin layout
        if (file === 'app/(admin)/_layout.tsx') {
            content = content.replace(/tabBarActivetintColor/g, 'tabBarActiveTintColor');
        }

        fs.writeFileSync(file, content, 'utf8');
        console.log('Cleaned up:', file);
    }
});
