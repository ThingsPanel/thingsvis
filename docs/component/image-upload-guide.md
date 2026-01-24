# 图片上传使用说明

## 概述

ThingsVis 提供了统一的图片上传接口，支持两种存储方式：
- **本地存储**（默认）：使用 IndexedDB 存储图片 Blob，返回 Object URL
- **OSS 云存储**：上传到阿里云 OSS 或其他兼容服务，返回 CDN URL

## 配置存储方式

访问设置页面配置存储方式：
```
http://localhost:3000/#/settings/image-upload
```

### 本地存储（默认）
- ✅ 无需配置，开箱即用
- ✅ 离线可用
- ✅ 不占用画布数据体积
- ✅ 使用 Object URL (blob:http://...)
- ⚠️ 存储在浏览器中，清除数据会丢失

### OSS 云存储
需要配置：
- Endpoint: OSS 服务地址
- Bucket: 存储桶名称
- Access Key ID: 访问密钥 ID
- Access Key Secret: 访问密钥

## 使用方法

### 方法 1: 使用 ImageUploader 组件（推荐）

```tsx
import { ImageUploader } from '@/components/ImageUploader';

function MyComponent() {
  const [imageUrl, setImageUrl] = useState<string>('');

  return (
    <div>
      <h3>上传图片</h3>
      <ImageUploader 
        onUpload={setImageUrl}
        allowRemove={true}
        maxWidth={400}
        maxHeight={400}
      />
      {imageUrl && <img src={imageUrl} alt="Preview" />}
    </div>
  );
}
```

### 方法 2: 直接调用上传函数

```tsx
import { uploadImage, revokeImageURL } from '@/lib/imageUpload';

async function handleFileUpload(file: File) {
  try {
    // 上传图片，根据设置自动选择存储方式
    const imageUrl = await uploadImage(file);
    
    // 使用返回的 URL
    console.log('Image URL:', imageUrl);
    
    // 在 img 标签中使用
    // <img src={imageUrl} />
    
    // 不再需要时释放内存（仅对 Object URL 有效）
    // revokeImageURL(imageUrl);
  } catch (error) {
    console.error('Upload failed:', error);
  }
}
```

## 返回值说明

### 本地存储返回的 URL
```
blob:http://localhost:3000/abc123...#img_1234567890_xyz
```
- 前半部分是 Object URL，可直接用于 `<img src>`
- `#` 后面是图片在 IndexedDB 中的 ID

### OSS 存储返回的 URL
```
https://your-bucket.oss-cn-hangzhou.aliyuncs.com/thingsvis/123456-abc.jpg
```
- 完整的 CDN URL，可直接访问

## 在画布节点中使用

如果你的节点需要支持图片上传：

```tsx
// 在节点配置面板中
import { ImageUploader } from '@/components/ImageUploader';

function ImageNodeConfig({ nodeData, updateNodeData }) {
  return (
    <div>
      <label>节点图片</label>
      <ImageUploader
        initialUrl={nodeData.imageUrl}
        onUpload={(url) => updateNodeData({ imageUrl: url })}
      />
    </div>
  );
}

// 在节点渲染中
function ImageNodeRenderer({ nodeData }) {
  return (
    <div>
      {nodeData.imageUrl && (
        <img 
          src={nodeData.imageUrl} 
          alt="Node"
          style={{ width: '100%', height: 'auto' }}
        />
      )}
    </div>
  );
}
```

## 注意事项

### Object URL 内存管理
本地存储返回的 Object URL 需要手动释放：

```tsx
useEffect(() => {
  // 组件卸载时释放 URL
  return () => {
    if (imageUrl && imageUrl.startsWith('blob:')) {
      revokeImageURL(imageUrl);
    }
  };
}, [imageUrl]);
```

### 从 IndexedDB 重新加载
页面刷新后，Object URL 会失效。如果需要重新显示图片：

```tsx
import { loadLocalImage } from '@/lib/imageUpload';

// 从保存的 URL 中提取 ID
const imageId = imageUrl.split('#')[1]; // img_1234567890_xyz

// 重新创建 Object URL
const newUrl = await loadLocalImage(imageId);
```

### OSS 上传注意
- 前端直接上传会暴露 Access Key，生产环境建议通过后端代理
- 需要配置 CORS 允许跨域上传
- 考虑实现签名 URL 机制提高安全性

## API 参考

### `uploadImage(file: File): Promise<string>`
上传图片并返回 URL。

**参数：**
- `file`: 要上传的图片文件

**返回：**
- Promise<string>: 图片 URL（Object URL 或 CDN URL）

**抛出：**
- 文件类型错误
- 文件大小超限（>10MB）
- 上传失败

### `loadLocalImage(id: string): Promise<string | null>`
从 IndexedDB 加载图片并创建新的 Object URL。

### `deleteLocalImage(id: string): Promise<void>`
从 IndexedDB 删除图片。

### `revokeImageURL(url: string): void`
释放 Object URL 占用的内存。

### `getImageUploadSettings(): ImageUploadSettings`
获取当前图片上传配置。

### `saveImageUploadSettings(settings: ImageUploadSettings): void`
保存图片上传配置。
