/**
 * Image Upload Settings Page
 * 
 * Configure image storage (local or OSS).
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, HardDrive, Cloud } from 'lucide-react';
import {
  getImageUploadSettings,
  saveImageUploadSettings,
  type ImageUploadSettings,
  type ImageStorageType,
} from '@/lib/imageUpload';

export default function ImageUploadSettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<ImageUploadSettings>({
    storageType: 'local',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const currentSettings = getImageUploadSettings();
    setSettings(currentSettings);
  }, []);

  const handleStorageTypeChange = (value: ImageStorageType) => {
    setSettings((prev) => ({
      ...prev,
      storageType: value,
    }));
  };

  const handleOSSConfigChange = (field: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      ossConfig: {
        ...prev.ossConfig!,
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      saveImageUploadSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('保存设置失败');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <h1 className="text-xl font-bold">图片上传设置</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>存储配置</CardTitle>
            <CardDescription>
              选择图片存储方式。默认使用本地存储（IndexedDB + Object URL），也可以配置OSS云存储。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Storage Type Selection */}
            <div className="space-y-2">
              <Label>存储方式</Label>
              <Select
                value={settings.storageType}
                onValueChange={handleStorageTypeChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      <span>本地存储（IndexedDB）</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="oss">
                    <div className="flex items-center gap-2">
                      <Cloud className="h-4 w-4" />
                      <span>OSS 云存储</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {settings.storageType === 'local' && (
                <p className="text-sm text-gray-500">
                  图片将保存在浏览器IndexedDB中，通过Object URL访问。适合离线使用，不占用画布数据体积。
                </p>
              )}
            </div>

            {/* OSS Configuration */}
            {settings.storageType === 'oss' && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">OSS 配置</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="endpoint">Endpoint</Label>
                  <Input
                    id="endpoint"
                    placeholder="https://oss-cn-hangzhou.aliyuncs.com"
                    value={settings.ossConfig?.endpoint || ''}
                    onChange={(e) => handleOSSConfigChange('endpoint', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bucket">Bucket</Label>
                  <Input
                    id="bucket"
                    placeholder="my-bucket"
                    value={settings.ossConfig?.bucket || ''}
                    onChange={(e) => handleOSSConfigChange('bucket', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Region (可选)</Label>
                  <Input
                    id="region"
                    placeholder="cn-hangzhou"
                    value={settings.ossConfig?.region || ''}
                    onChange={(e) => handleOSSConfigChange('region', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accessKeyId">Access Key ID</Label>
                  <Input
                    id="accessKeyId"
                    type="password"
                    placeholder="Your Access Key ID"
                    value={settings.ossConfig?.accessKeyId || ''}
                    onChange={(e) => handleOSSConfigChange('accessKeyId', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accessKeySecret">Access Key Secret</Label>
                  <Input
                    id="accessKeySecret"
                    type="password"
                    placeholder="Your Access Key Secret"
                    value={settings.ossConfig?.accessKeySecret || ''}
                    onChange={(e) => handleOSSConfigChange('accessKeySecret', e.target.value)}
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                  <p className="font-medium mb-1">⚠️ 安全提示</p>
                  <p>
                    Access Key 将保存在浏览器本地存储中。生产环境建议通过后端代理上传，避免暴露密钥。
                  </p>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="pt-4 flex items-center gap-3">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? '保存中...' : '保存设置'}
              </Button>
              {saveSuccess && (
                <span className="text-sm text-green-600 font-medium">
                  ✓ 设置已保存
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
