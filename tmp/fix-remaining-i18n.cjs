const fs = require('fs');
const path = require('path');

const zhDictPath = 'f:/coding/thingsvis/apps/studio/src/i18n/locales/zh/editor.json';
const enDictPath = 'f:/coding/thingsvis/apps/studio/src/i18n/locales/en/editor.json';

const zhDict = JSON.parse(fs.readFileSync(zhDictPath, 'utf8'));
const enDict = JSON.parse(fs.readFileSync(enDictPath, 'utf8'));

// Common dictionary
const map = {
    'x': { key: 'props.x', en: 'X' },
    'y': { key: 'props.y', en: 'Y' },
    '折线路径点': { key: 'props.linePoints', en: 'Line Points' },
    '风格': { key: 'props.lineRenderStyle', en: 'Render Style' },
    '箭头方向（兼容）': { key: 'props.arrowDirLegacy', en: 'Arrow Direction (Legacy)' },
    '虚线 (SVG stroke-dasharray)': { key: 'props.dashPatternLegacy', en: 'Dash Pattern (Legacy)' },
    '填充颜色': { key: 'props.fillColor', en: 'Fill Color' },
    '边框宽度': { key: 'props.borderWidth', en: 'Border Width' },
    '圆角半径': { key: 'props.borderRadius', en: 'Border Radius' },
    '当前状态': { key: 'props.switchStatus', en: 'Switch Status' },
    '表头配置': { key: 'props.tableColumns', en: 'Table Columns' },
    '表格数据': { key: 'props.tableData', en: 'Table Data' },
    '表头文字颜色': { key: 'props.tableHeaderColor', en: 'Header Text Color' },
    '行背景色': { key: 'props.tableRowBg', en: 'Row Background' },
    '行文字颜色': { key: 'props.tableRowColor', en: 'Row Text Color' },
    '文字大小(px)': { key: 'props.tableFontSize', en: 'Text Size (px)' },

    '字号': { key: 'props.fontSize', en: 'Font Size' },
    '字体': { key: 'props.fontFamily', en: 'Font Family' },
    '字重': { key: 'props.fontWeight', en: 'Font Weight' },
    '斜体': { key: 'props.fontStyle', en: 'Font Style' },
    '对齐方式': { key: 'props.textAlign', en: 'Text Align' },
    '行高': { key: 'props.lineHeight', en: 'Line Height' },
    '字间距': { key: 'props.letterSpacing', en: 'Letter Spacing' },
    '装饰线': { key: 'props.textDecoration', en: 'Text Decoration' },
    '文字颜色': { key: 'props.textColor', en: 'Text Color' },
    '背景颜色': { key: 'props.bgColor', en: 'Background Color' },

    '启用阴影': { key: 'props.textShadowEnabled', en: 'Enable Shadow' },
    '阴影颜色': { key: 'props.textShadowColor', en: 'Shadow Color' },
    '阴影模糊': { key: 'props.textShadowBlur', en: 'Shadow Blur' },
    '阴影X偏移': { key: 'props.textShadowOffsetX', en: 'Shadow Offset X' },
    '阴影Y偏移': { key: 'props.textShadowOffsetY', en: 'Shadow Offset Y' },
    '内边距': { key: 'props.padding', en: 'Padding' },
    '外边距': { key: 'props.margin', en: 'Margin' },

    '是否为环形图': { key: 'props.isDonut', en: 'Is Donut Chart' },
    '数值颜色': { key: 'props.valueColor', en: 'Value Color' },
    '标题颜色': { key: 'props.titleColor', en: 'Title Color' },
    '网页地址': { key: 'props.iframeUrl', en: 'URL' },
    '图片数据': { key: 'props.imageData', en: 'Image Data' },
    '填充方式': { key: 'props.objectFit', en: 'Object Fit' }
};

function setNested(obj, pathStr, value) {
    const keys = pathStr.split('.');
    let cur = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = cur[keys[i]] || {};
        cur = cur[keys[i]];
    }
    cur[keys[keys.length - 1]] = value;
}

function walk(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const f of files) {
        const p = path.join(dir, f.name);
        if (f.isDirectory()) {
            walk(p);
        } else if (f.isFile() && p.endsWith('.ts')) {
            let content = fs.readFileSync(p, 'utf8');
            let updated = false;

            // match .describe('xxxxx') where xxxxx has chinese
            const regex = /\.describe\(['"]([^'"]+)['"]\)/g;
            let m;
            while ((m = regex.exec(content)) !== null) {
                const zhText = m[1];
                if (/[\u4e00-\u9fa5]/.test(zhText)) {
                    if (map[zhText]) {
                        content = content.replace(m[0], `.describe('${map[zhText].key}')`);
                        setNested(zhDict, map[zhText].key, zhText);
                        setNested(enDict, map[zhText].key, map[zhText].en);
                        updated = true;
                    } else {
                        console.log(`Unmapped chinese in ${p}: ${zhText}`);
                    }
                }
            }
            if (updated) {
                fs.writeFileSync(p, content, 'utf8');
                console.log(`Fixed: ${p}`);
            }
        }
    }
}

walk('f:/coding/thingsvis/widgets');

fs.writeFileSync(zhDictPath, JSON.stringify(zhDict, null, 4));
fs.writeFileSync(enDictPath, JSON.stringify(enDict, null, 4));
console.log('Done!');
