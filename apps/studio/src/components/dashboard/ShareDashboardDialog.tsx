/**
 * ShareDashboardDialog
 *
 * A dialog component for creating and managing dashboard share links.
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  createShareLink,
  getShareInfo,
  revokeShareLink,
  type ShareLinkInfo,
} from '@/lib/api/dashboards';

interface ShareDashboardDialogProps {
  dashboardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDashboardDialog({
  dashboardId,
  open,
  onOpenChange,
}: ShareDashboardDialogProps) {
  const { t, i18n } = useTranslation('editor');
  const [loading, setLoading] = useState(false);
  const [shareInfo, setShareInfo] = useState<ShareLinkInfo | null>(null);
  const [latestShareUrl, setLatestShareUrl] = useState<string | null>(null);
  const [expirationDays, setExpirationDays] = useState<number>(7);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      loadShareInfo();
    }
  }, [open, dashboardId]);

  const loadShareInfo = async () => {
    setLoading(true);
    try {
      const response = await getShareInfo(dashboardId);
      if (response.data) {
        setShareInfo(response.data);
      } else if (response.error) {
        setShareInfo(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShare = async () => {
    setLoading(true);
    try {
      const expiresIn = expirationDays > 0 ? expirationDays * 24 * 3600 : undefined;
      const response = await createShareLink(dashboardId, { expiresIn });
      if (response.error) {
        const hint = response.error.toLowerCase().includes('not found')
          ? `\n${t('shareDialog.errors.unsavedHint')}`
          : '';
        alert(`${t('shareDialog.errors.createFailed')}: ${response.error}${hint}`);
        return;
      }
      const createdUrl = response.data?.shareUrl || null;
      const createdExpiresAt = response.data?.expiresAt || null;
      if (!createdUrl) {
        alert(t('shareDialog.errors.createFailed'));
        return;
      }
      setLatestShareUrl(createdUrl);
      setShareInfo({
        enabled: true,
        url: createdUrl,
        expiresAt: createdExpiresAt,
      });
    } catch (error) {
      alert(t('shareDialog.errors.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    const urlToCopy = latestShareUrl || shareInfo?.url;
    if (urlToCopy) {
      try {
        await navigator.clipboard.writeText(urlToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        alert(t('shareDialog.errors.copyFailed'));
      }
    }
  };

  const handleRevoke = async () => {
    if (!confirm(t('shareDialog.confirmRevoke'))) return;

    setLoading(true);
    try {
      const response = await revokeShareLink(dashboardId);
      if (response.error) {
        alert(`${t('shareDialog.errors.revokeFailed')}: ${response.error}`);
        return;
      }
      setShareInfo(null);
      setLatestShareUrl(null);
    } catch (error) {
      alert(t('shareDialog.errors.revokeFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const isExpired = shareInfo?.expiresAt && new Date(shareInfo.expiresAt) < new Date();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{t('shareDialog.title')}</h2>
          <button onClick={() => onOpenChange(false)}>×</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : shareInfo?.enabled ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('shareDialog.linkLabel')}</label>
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
                  {copied ? t('shareDialog.copied') : t('shareDialog.copy')}
                </button>
              </div>
            </div>

            {shareInfo.expiresAt && (
              <div className="text-sm">
                <span className={isExpired ? 'text-red-600' : ''}>
                  {isExpired ? t('shareDialog.expired') : t('shareDialog.expiresAt')}:
                </span>
                <span className="ml-2">
                  {new Date(shareInfo.expiresAt).toLocaleString(
                    i18n.language === 'zh' ? 'zh-CN' : 'en-US',
                  )}
                </span>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleRevoke}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-md"
              >
                {t('shareDialog.revoke')}
              </button>
              <button
                onClick={() => onOpenChange(false)}
                className="flex-1 px-4 py-2 bg-gray-200 rounded-md"
              >
                {t('shareDialog.close')}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">{t('shareDialog.description')}</p>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('shareDialog.expirationLabel')}
              </label>
              <select
                value={expirationDays}
                onChange={(e) => setExpirationDays(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value={1}>{t('shareDialog.expiration.1d')}</option>
                <option value={7}>{t('shareDialog.expiration.7d')}</option>
                <option value={30}>{t('shareDialog.expiration.30d')}</option>
                <option value={0}>{t('shareDialog.expiration.never')}</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleCreateShare}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md"
              >
                {t('shareDialog.create')}
              </button>
              <button
                onClick={() => onOpenChange(false)}
                className="flex-1 px-4 py-2 bg-gray-200 rounded-md"
              >
                {t('shareDialog.cancel')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
