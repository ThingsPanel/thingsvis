/**
 * ShareDashboardDialog
 *
 * A dialog component for creating and managing dashboard share links.
 */

import React, { useState, useEffect } from 'react';
import {
  createShareLink,
  getShareInfo,
  revokeShareLink,
  type ShareLinkInfo,
} from '@/lib/api/dashboards';

interface ShareDashboardDialogProps {
  dashboardId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareDashboardDialog({ dashboardId, isOpen, onClose }: ShareDashboardDialogProps) {
  const [loading, setLoading] = useState(false);
  const [shareInfo, setShareInfo] = useState<ShareLinkInfo | null>(null);
  const [expirationDays, setExpirationDays] = useState<number>(7);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadShareInfo();
    }
  }, [isOpen, dashboardId]);

  const loadShareInfo = async () => {
    setLoading(true);
    try {
      const response = await getShareInfo(dashboardId);
      if (response.data) {
        setShareInfo(response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShare = async () => {
    setLoading(true);
    try {
      const expiresIn = expirationDays > 0 ? expirationDays * 24 * 3600 : undefined;
      await createShareLink(dashboardId, { expiresIn });
      await loadShareInfo();
    } catch (error) {
      alert('创建分享链接失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (shareInfo?.url) {
      try {
        const response = await createShareLink(dashboardId, {
          expiresIn: expirationDays > 0 ? expirationDays * 24 * 3600 : undefined,
        });

        if (response.data?.shareUrl) {
          await navigator.clipboard.writeText(response.data.shareUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  const handleRevoke = async () => {
    if (!confirm('确定要吊销分享链接吗？')) return;

    setLoading(true);
    try {
      await revokeShareLink(dashboardId);
      setShareInfo(null);
    } catch (error) {
      alert('吊销分享链接失败');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isExpired = shareInfo?.expiresAt && new Date(shareInfo.expiresAt) < new Date();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">分享仪表板</h2>
          <button onClick={onClose}>×</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : shareInfo?.enabled ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">分享链接</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareInfo.url || ''}
                  readOnly
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md"
                >
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
            </div>

            {shareInfo.expiresAt && (
              <div className="text-sm">
                <span className={isExpired ? 'text-red-600' : ''}>
                  {isExpired ? '已过期' : '过期时间'}:
                </span>
                <span className="ml-2">
                  {new Date(shareInfo.expiresAt).toLocaleString('zh-CN')}
                </span>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleRevoke}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-md"
              >
                吊销分享
              </button>
              <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-200 rounded-md">
                关闭
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">创建分享链接后，任何人都可以通过链接访问此仪表板。</p>

            <div>
              <label className="block text-sm font-medium mb-2">有效期</label>
              <select
                value={expirationDays}
                onChange={(e) => setExpirationDays(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value={1}>1 天</option>
                <option value={7}>7 天</option>
                <option value={30}>30 天</option>
                <option value={0}>永不过期</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleCreateShare}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md"
              >
                创建分享链接
              </button>
              <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-200 rounded-md">
                取消
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
