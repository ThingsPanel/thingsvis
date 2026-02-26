const fs = require('fs');
const path = require('path');

const widgetsDir = 'f:/coding/thingsvis/widgets';
const categories = fs.readdirSync(widgetsDir, { withFileTypes: true }).filter(d => d.isDirectory());

const dict = {
    "基础文本": "Text",
    "图形文本": "Graphic Text",
    "圆形": "Circle",
    "连线": "Line",
    "矩形": "Rectangle",
    "开关": "Switch",
    "表格": "Table",
    "柱状图": "Bar Chart",
    "仪表盘": "Gauge",
    "折线图": "Line Chart",
    "饼图": "Pie Chart",
    "时间趋势图": "Time Trend Chart",
    "数值卡片": "Number Card",
    "Iframe 容器": "Iframe Container",
    "图片展示": "Image Display",
    "资源容器": "Resource Container"
};

for (const c of categories) {
    const cPath = path.join(widgetsDir, c.name);
    const widgets = fs.readdirSync(cPath, { withFileTypes: true }).filter(d => d.isDirectory());
    for (const w of widgets) {
        const pkgPath = path.join(cPath, w.name, 'package.json');
        if (fs.existsSync(pkgPath)) {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            if (pkg.thingsvis) {
                const zhName = pkg.thingsvis.displayName;
                if (!pkg.thingsvis.i18n) {
                    pkg.thingsvis.i18n = {
                        zh: zhName,
                        en: dict[zhName] || zhName
                    };
                    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 4));
                    console.log(`Updated ${w.name}: zh=${zhName}, en=${dict[zhName] || zhName}`);
                }
            }
        }
    }
}
