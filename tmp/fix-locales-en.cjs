const fs = require('fs');
const path = require('path');

const dict = {
    "颜色": "Color",
    "管道背景": "Pipe Background",
    "流动颜色": "Flow Color",
    "起点节点": "Source Node",
    "终点节点": "Target Node",
    "风格": "Style",
    "线条": "Line",
    "管道": "Pipe",
    "路线": "Route",
    "直线": "Straight",
    "折线": "Polyline",
    "曲线": "Curved",
    "脑图": "Mindmap",
    "线型": "Line Style",
    "实线": "Solid",
    "虚线": "Dashed",
    "点线": "Dotted",
    "粗细": "Thickness",
    "透明度": "Opacity",
    "起点箭头": "Start Arrow",
    "无": "None",
    "箭头": "Arrow",
    "终点箭头": "End Arrow",
    "箭头大小": "Arrow Size",
    "启用流动": "Enable Flow",
    "流动速度": "Flow Speed",
    "流动间距": "Flow Spacing",
    "流动长度": "Flow Length",
    "文本内容": "Text Content",
    "字号": "Font Size",
    "字体": "Font Family",
    "无衬线": "Sans-serif",
    "衬线": "Serif",
    "等宽": "Monospace",
    "Arial": "Arial",
    "Helvetica": "Helvetica",
    "Times New Roman": "Times New Roman",
    "Georgia": "Georgia",
    "Courier New": "Courier New",
    "微软雅黑": "Microsoft YaHei",
    "苹方": "PingFang SC",
    "黑体": "SimHei",
    "宋体": "SimSun",
    "字重": "Font Weight",
    "正常": "Normal",
    "粗体": "Bold",
    "细体": "Lighter",
    "100": "100",
    "200": "200",
    "300": "300",
    "400": "400",
    "500": "500",
    "600": "600",
    "700": "700",
    "800": "800",
    "900": "900",
    "斜体": "Italic",
    "水平对齐": "Horizontal Align",
    "左": "Left",
    "中": "Center",
    "右": "Right",
    "两端": "Justify",
    "垂直对齐": "Vertical Align",
    "上": "Top",
    "下": "Bottom",
    "行高": "Line Height",
    "字间距": "Letter Spacing",
    "装饰线": "Decoration",
    "下划线": "Underline",
    "删除线": "Line-through",
    "排版": "Layout",
    "文字颜色": "Text Color",
    "背景颜色": "Background Color",
    "不透明度": "Opacity",
    "启用阴影": "Enable Shadow",
    "阴影颜色": "Shadow Color",
    "模糊半径": "Blur Radius",
    "X 偏移": "Offset X",
    "Y 偏移": "Offset Y",
    "阴影": "Shadow",
    "内边距": "Padding"
};

const root = 'f:/coding/thingsvis/widgets';
const dirs = fs.readdirSync(root, { withFileTypes: true }).filter(d => d.isDirectory());

let updatedCount = 0;

for (const c of dirs) {
    const catPath = path.join(root, c.name);
    const widgets = fs.readdirSync(catPath, { withFileTypes: true }).filter(d => d.isDirectory());
    for (const w of widgets) {
        const enFile = path.join(catPath, w.name, 'src', 'locales', 'en.json');
        if (fs.existsSync(enFile)) {
            let content = fs.readFileSync(enFile, 'utf8');
            let changed = false;
            const obj = JSON.parse(content);
            if (obj.editor) {
                for (const ns of Object.keys(obj.editor)) {
                    for (const k of Object.keys(obj.editor[ns])) {
                        const val = obj.editor[ns][k];
                        if (typeof val === 'string' && val.startsWith('[en] ')) {
                            const zhStr = val.replace('[en] ', '');
                            if (dict[zhStr]) {
                                obj.editor[ns][k] = dict[zhStr];
                                changed = true;
                            } else {
                                obj.editor[ns][k] = zhStr; // fallback to removing prefix
                                changed = true;
                            }
                        }
                    }
                }
            }
            if (changed) {
                fs.writeFileSync(enFile, JSON.stringify(obj, null, 2), 'utf8');
                updatedCount++;
                console.log(`Updated ${enFile}`);
            }
        }
    }
}

console.log(`Done! Updated ${updatedCount} locales.`);
