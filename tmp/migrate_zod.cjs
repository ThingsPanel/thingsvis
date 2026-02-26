const fs = require('fs');
const path = require('path');

const zhP = 'f:/coding/thingsvis/apps/studio/src/i18n/locales/zh/editor.json';
const enP = 'f:/coding/thingsvis/apps/studio/src/i18n/locales/en/editor.json';

const zhRaw = fs.readFileSync(zhP, 'utf8');
const enRaw = fs.readFileSync(enP, 'utf8');
let zh = JSON.parse(zhRaw);
let en = JSON.parse(enRaw);

// Keys containing Chinese
const badKeys = Object.keys(zh).filter(k => /[\u4e00-\u9fa5]/.test(k));

const keyMap = {
    // Left panel / Layers
    "暂无图层": "layersPanel.empty",
    "添加组件到画布以查看图层": "layersPanel.addHint",
    "隐藏": "common.hide",
    "显示": "common.show",
    "解锁": "common.unlock",
    "锁定": "common.lock",
    "置于顶层": "layersPanel.bringToFront",
    "上移一层": "layersPanel.bringForward",
    "下移一层": "layersPanel.sendBackward",
    "置于底层": "layersPanel.sendToBack",
    "成组": "layersPanel.group",
    "删除": "common.delete",
    "隐藏组": "layersPanel.hideGroup",
    "显示组": "layersPanel.showGroup",
    "解锁组": "layersPanel.unlockGroup",
    "锁定组": "layersPanel.lockGroup",
    "取消成组": "layersPanel.ungroup",
    "删除组": "layersPanel.deleteGroup",

    // Common binding labels
    "静态": "binding.static",
    "字段": "binding.field",
    "表达式": "binding.expression",
    "透明": "common.transparent",
    "透明 / #hex / rgba()": "common.transparentInput",
    "(请选择)": "common.pleaseSelect",
    "开启": "common.on",
    "关闭": "common.off",
    "表达式必须使用 {{ }} 包裹。": "binding.exprTip",
    "静态值已被绑定覆盖。": "binding.overridden",
    "(无连接)": "binding.noConnection",
    "数据源": "binding.dataSource",
    "平台字段": "binding.platformField",
    "(未选择)": "binding.notSelected",
    "(请选择数据源)": "binding.selectDataSource",
    "平台字段 (Platform Fields)": "binding.platformFieldsLabel",
    "(请选择字段)": "binding.selectField",
    " (需选子字段)": "binding.needChildField",
    "数据加载中...": "common.loadingData",
    "数据源错误: ": "binding.dataSourceError",
    "数据源暂无数据，请检查配置或等待数据推送。": "binding.noDataHint",
    "字段列表已截断（深度/数量限制）。": "binding.fieldTruncated",
    "平台字段由外部应用提供": "binding.externalProvided",

    // Image/Upload
    "只支持图片文件": "upload.onlyImages",
    "图片大小不能超过10MB": "upload.sizeLimit",
    "上传失败": "upload.failed",
    "上传图片": "upload.button",
    "上传": "upload.action",
    "输入链接": "upload.inputUrl",
    "链接": "upload.url",
    "输入Base64": "upload.inputBase64",
    "上传中...": "upload.uploading",
    "点击上传图片": "upload.clickToUpload",
    "上传到服务器 (Max 10MB)": "upload.uploadToServer",
    "https://example.com/image.jpg": "upload.urlExample",
    "data:image/png;base64,... 或 Base64字符串": "upload.base64Example",
    "清除": "common.clear",

    // Data Sources
    "认证配置": "datasource.auth",
    "请求体": "datasource.reqBody",
    "请求头": "datasource.headers",
    "添加自定义 HTTP 请求头": "datasource.addHeader",
    "请求头名称": "datasource.headerName",
    "请求头值": "datasource.headerValue",
    "心跳保活": "datasource.heartbeat",
    "启用心跳": "datasource.enableHeartbeat",
    "发送间隔": "common.interval",
    "秒": "common.seconds",
    "心跳消息": "datasource.heartbeatMessage",
    "例如: ping 或 {\"type\":\"ping\"}": "datasource.pingExample",
    "初始订阅消息": "datasource.initMessage",
    "暂无初始消息，点击下方按钮添加": "datasource.noInitMessage",
    "添加消息": "datasource.addMessage",
    "子协议": "datasource.subProtocol",
    "重连策略": "datasource.reconnectStrategy",
    "启用自动重连": "datasource.enableReconnect",
    "最大重连次数": "datasource.maxReconnect",
    "(0 = 无限)": "datasource.zeroUnlimited",
    "初始重连间隔": "datasource.initInterval",
    "指数退避": "datasource.exponentialBackoff",
    "每次重连间隔翻倍": "datasource.doubleInterval",
    "最大重连间隔": "datasource.maxInterval",
    "超时设置": "datasource.timeout",

    // Widget Props
    "内容": "props.content",
    "样式": "props.style",
    "数据": "props.data",
    "图表标题": "props.chartTitle",
    "主色调": "props.primaryColor",
    "次色调": "props.secondaryColor",
    "显示图例": "props.showLegend",
    "显示X轴": "props.showXAxis",
    "显示Y轴": "props.showYAxis",
    "平滑曲线": "props.smoothCurve",
    "显示面积阴影": "props.showArea",
    "数据集": "props.dataset",
    "背景色": "props.bgColor",
    "文本内容": "props.textContent",
    "字号大小": "props.fontSize",
    "字体粗细": "props.fontWeight",
    "字体颜色": "props.fontColor",
    "水平对齐": "props.alignHorizontal",
    "垂直对齐": "props.alignVertical",
    "线条颜色": "props.lineColor",
    "线条宽度": "props.lineWidth",
    "线型": "props.lineStyle",
    "圆角大小": "props.borderRadius",
    "图片URL": "props.imageUrl",
    "适应方式": "props.objectFit",
    "不透明度": "props.opacity",
    "标题": "props.title",
    "前缀": "props.prefix",
    "后缀": "props.suffix",
    "数值": "props.value",
    "最大值": "props.max",
    "最小值": "props.min",
    "图表颜色": "props.chartColor",
    "启用表头": "props.enableHeader",
    "表头背景色": "props.headerBgColor",
    "边框颜色": "props.borderColor",
    "条纹背景": "props.stripedBg",
    "空心形状": "props.hollowShape",
    "开启颜色": "props.activeColor",
    "关闭颜色": "props.inactiveColor",
    "Iframe 地址": "props.iframeUrl",
    "粗细": "props.thickness",
    "颜色": "props.color",
    "透明度": "props.opacityAlias", // Alias for opacity
    "外框宽度(px)": "props.borderWidthPx",
    "外框颜色": "props.borderColorAlias", // Alias for border color
    "端点样式": "props.lineCap",
    "粗糙度": "props.roughness",
    "箭头类型": "props.arrowType",
    "起点箭头": "props.startArrow",
    "终点箭头": "props.endArrow",
    "大小": "props.size",
    "管道背景": "props.pipeBg",
    "启用流动": "props.enableFlow",
    "速度(px/s)": "props.speedPxS",
    "间距(px)": "props.spacingPx",
    "流动长度(px)": "props.flowLengthPx",
    "流动颜色": "props.flowColor",
    "起点节点": "props.sourceNode",
    "起点锚点": "props.sourceAnchor",
    "终点节点": "props.targetNode",
    "终点锚点": "props.targetAnchor",
    "单位": "props.unit",
    "刻度最小值": "props.scaleMin",
    "刻度最大值": "props.scaleMax",
    "显示数值": "props.showNumericalValue",
    "仪表盘颜色": "props.gaugeColor",
    "分割线颜色": "props.splitLineColor"
};

for (const bk of badKeys) {
    if (!keyMap[bk]) {
        console.warn(`WARNING: Missing keyMap for ${bk}`);
        keyMap[bk] = `common.generated_${Buffer.from(bk).toString('hex').slice(0, 8)}`;
    }
}

function setNested(obj, pathStr, value) {
    const parts = pathStr.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
}

for (const bk of badKeys) {
    const zhVal = zh[bk];
    const enVal = en[bk];

    const newKey = keyMap[bk];

    // Inject into nested layout
    setNested(zh, newKey, zhVal);
    setNested(en, newKey, enVal);

    // Delete at root
    delete zh[bk];
    delete en[bk];
}

fs.writeFileSync(zhP, JSON.stringify(zh, null, 4));
fs.writeFileSync(enP, JSON.stringify(en, null, 4));
console.log('Updated editor.json dictionary.');

function walkSync(dir, filelist = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === 'dist' || file === '.git' || file === 'public') continue;
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            walkSync(filepath, filelist);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            filelist.push(filepath);
        }
    }
    return filelist;
}

const allFiles = [
    ...walkSync('f:/coding/thingsvis/apps/studio/src'),
    ...walkSync('f:/coding/thingsvis/packages/thingsvis-schema/src'),
    ...walkSync('f:/coding/thingsvis/widgets')
];

let totalChangedFiles = 0;

for (const f of allFiles) {
    let content = fs.readFileSync(f, 'utf8');
    let changed = false;

    // We do simple string literal replacement to replace '旧的中文' with 'props.newKey'
    // in source code.
    for (const bk of badKeys) {
        // match exactly the string, wrapped in single or double quotes
        // We use split/join since strings might have quotes but usually simply it's fine
        const p1 = `'${bk}'`;
        const p2 = `"${bk}"`;

        const targetKey = `'${keyMap[bk]}'`;
        const targetKeyD = `"${keyMap[bk]}"`;

        if (content.includes(p1)) {
            content = content.split(p1).join(targetKey);
            changed = true;
        }
        if (content.includes(p2)) {
            content = content.split(p2).join(targetKeyD);
            changed = true;
        }
    }

    if (changed) {
        fs.writeFileSync(f, content, 'utf8');
        totalChangedFiles++;
    }
}

console.log(`Updated ${totalChangedFiles} source code files to use English keys.`);
