const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        if (file === 'node_modules' || file === 'dist' || file === 'build') continue;
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(filePath);
        }
    }
    return results;
}

const files = walk('f:/coding/thingsvis/widgets');
let count = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    let changed = false;

    const changedTokens = [
        '!!ctx.isDark',
        '!!newCtx.isDark',
        'let isDark = true' // catch pre-replaced content from earlier botched run
    ];

    if (changedTokens.some(t => content.includes(t))) {

        // Import `resolveWidgetColors`
        if (content.match(/import \{ ([^}]+) \} from '@thingsvis\/widget-sdk';/)) {
            if (!content.includes('resolveWidgetColors')) {
                content = content.replace(/import \{ ([^}]+) \} from '@thingsvis\/widget-sdk';/, "import { $1, resolveWidgetColors, type WidgetColors } from '@thingsvis/widget-sdk';");
                changed = true;
            }
        } else if (!content.includes('resolveWidgetColors')) {
            content = "import { resolveWidgetColors, type WidgetColors } from '@thingsvis/widget-sdk';\n" + content;
            changed = true;
        }

        content = content.replace(/let isDark = !!ctx\.isDark;/g, "let colors: WidgetColors = resolveWidgetColors(element);\n  let isDark = true;");
        content = content.replace(/isDark = !!newCtx\.isDark;/g, "colors = resolveWidgetColors(element);\n      isDark = true;");

        // Replace function signatures if it passes `isDark`
        content = content.replace(/isDark: boolean/g, "colors: WidgetColors");

        // Calls to buildOption
        content = content.replace(/buildOption\(([^,]+),\s*isDark\)/g, "buildOption($1, colors)");
        content = content.replace(/buildOption\(([^,]+),\s*isDark,\s*([^)]+)\)/g, "buildOption($1, colors, $2)");

        // Replace text color calculations
        content = content.replace(/const textColor = colors \? '[^']+' : '[^']+';/g, "const textColor = colors?.fg ?? '#333';");
        content = content.replace(/const splitLineColor = colors \? '[^']+' : '[^']+';/g, "const splitLineColor = colors?.axis ?? '#00000010';");

        // Also catch any leftover ternary assignments
        content = content.replace(/const textColor = isDark \? '[^']+' : '[^']+';/g, "const textColor = colors?.fg ?? '#333';");
        content = content.replace(/const splitLineColor = isDark \? '[^']+' : '[^']+';/g, "const splitLineColor = colors?.axis ?? '#00000010';");

        content = content.replace(/borderColor: isDark \? '[^']+' : '[^']+'/g, "borderColor: colors?.bg ?? '#fff'");

        // Special logic for UPlot
        content = content.replace(/const strokeColor = isDark \? '#fff' : '#000';/g, "const strokeColor = colors?.fg ?? '#333';");

        if (changed) {
            fs.writeFileSync(file, content, 'utf-8');
            console.log('Fixed', file);
            count++;
        }
    }
}
console.log('Total files fixed:', count);
