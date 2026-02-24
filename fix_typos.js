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
    let finalContent = content.replace(/shadowcolor:/gi, 'shadowColor:').replace(/tintcolor:/gi, 'tintColor:').replace(/trackcolor:/gi, 'trackColor:').replace(/thumbcolor:/gi, 'thumbColor:').replace(/iconcolor:/gi, 'iconColor:');
    
    if (content !== finalContent) {
        fs.writeFileSync(file, finalContent, 'utf8');
        console.log('Fixed typos in:', file);
    }
});
