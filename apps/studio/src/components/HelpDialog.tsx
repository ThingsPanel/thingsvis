import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { Github, BookOpen, MessageCircle } from 'lucide-react';

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
  const { t } = useTranslation('editor');

  const IS_MAC = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
  const CMD_KEY = IS_MAC ? '⌘' : 'Ctrl';

  const shortcuts = [
    { label: t('helpDialog.undo'), keys: [CMD_KEY, 'Z'] },
    { label: t('helpDialog.redo'), keys: [CMD_KEY, 'Y'] },
    { label: t('helpDialog.copyPaste'), keys: [CMD_KEY, 'C / V'] },
    { label: t('helpDialog.save'), keys: [CMD_KEY, 'S'] },
    { label: t('helpDialog.delete'), keys: ['Backspace / Delete'] },
    { label: t('helpDialog.pan'), keys: [t('helpDialog.panKey')] },
  ];

  const links = [
    {
      icon: <Github className="h-4 w-4" />,
      label: t('helpDialog.github'),
      href: 'https://github.com/thingspanel/thingsvis',
    },
    {
      icon: <BookOpen className="h-4 w-4" />,
      label: t('helpDialog.documentation'),
      href: 'https://docs.thingsvis.io', // TODO: Update to actual docs URL
    },
    {
      icon: <MessageCircle className="h-4 w-4" />,
      label: t('helpDialog.issue'),
      href: 'https://github.com/thingspanel/thingsvis/issues/new',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('helpDialog.title')}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          {/* Shortcuts Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {t('helpDialog.shortcuts')}
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {shortcuts.map((shortcut, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{shortcut.label}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, keyIdx) => (
                      <React.Fragment key={keyIdx}>
                        <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[11px] font-medium text-muted-foreground opacity-100">
                          {key}
                        </kbd>
                        {keyIdx < shortcut.keys.length - 1 && (
                          <span className="text-muted-foreground text-xs">+</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Links Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {t('helpDialog.links')}
            </h4>
            <div className="flex flex-col gap-1.5">
              {links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors p-2 rounded-md hover:bg-muted"
                >
                  {link.icon}
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
