import React, { useState, useMemo } from 'react';
import * as Popover from '@radix-ui/react-popover';
import * as LucideIcons from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

const COMMON_ICONS = [
  'Activity',
  'AlertCircle',
  'AlertTriangle',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'Award',
  'BarChart',
  'Bell',
  'BellOff',
  'Book',
  'Bookmark',
  'Box',
  'Briefcase',
  'Calendar',
  'Camera',
  'Check',
  'CheckCircle',
  'ChevronDown',
  'ChevronLeft',
  'ChevronRight',
  'ChevronUp',
  'Clock',
  'Cloud',
  'Code',
  'Command',
  'Copy',
  'Cpu',
  'CreditCard',
  'Database',
  'Download',
  'Edit',
  'ExternalLink',
  'Eye',
  'EyeOff',
  'File',
  'FileText',
  'Filter',
  'Flag',
  'Folder',
  'Globe',
  'Heart',
  'HelpCircle',
  'Home',
  'Image',
  'Info',
  'Key',
  'Layers',
  'Layout',
  'Link',
  'List',
  'Lock',
  'LogOut',
  'Mail',
  'Map',
  'MapPin',
  'Maximize',
  'Menu',
  'MessageCircle',
  'MessageSquare',
  'Mic',
  'Minimize',
  'Monitor',
  'Moon',
  'MoreHorizontal',
  'MoreVertical',
  'Move',
  'Music',
  'Navigation',
  'Package',
  'Paperclip',
  'Pause',
  'Phone',
  'PieChart',
  'Play',
  'Plus',
  'PlusCircle',
  'PlusSquare',
  'Power',
  'Printer',
  'RefreshCcw',
  'RefreshCw',
  'Save',
  'Search',
  'Send',
  'Server',
  'Settings',
  'Share',
  'Share2',
  'Shield',
  'ShoppingBag',
  'ShoppingCart',
  'Sliders',
  'Smartphone',
  'Speaker',
  'Star',
  'Sun',
  'Target',
  'Terminal',
  'ThumbsDown',
  'ThumbsUp',
  'ToggleLeft',
  'ToggleRight',
  'Trash',
  'Trash2',
  'TrendingDown',
  'TrendingUp',
  'Tv',
  'Type',
  'Umbrella',
  'Unlock',
  'Upload',
  'User',
  'UserCheck',
  'UserMinus',
  'UserPlus',
  'Users',
  'Video',
  'VideoOff',
  'Volume',
  'Volume1',
  'Volume2',
  'VolumeX',
  'Wifi',
  'Wind',
  'X',
  'XCircle',
  'XSquare',
  'Zap',
  'ZoomIn',
  'ZoomOut',
];

/**
 * Convert PascalCase icon name to Unocss format
 * Example: Activity -> i-lucide:activity, ArrowRight -> i-lucide:arrow-right
 */
function toUnocssName(name: string): string {
  const kebab = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  return `i-lucide:${kebab}`;
}

const ICON_PREFIX = 'i-lucide:';

/**
 * Extract PascalCase icon name from Unocss format
 * Example: i-lucide:arrow-right -> ArrowRight
 */
function fromUnocssName(kebabName: string): string {
  if (!kebabName.startsWith(ICON_PREFIX)) return '';
  const raw = kebabName.slice(ICON_PREFIX.length);
  return raw
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentIconKey = fromUnocssName(value);

  // Ensure we safely pull from LucideIcons using an index signature
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ActiveIconComponent = currentIconKey ? (LucideIcons as any)[currentIconKey] : null;

  const filteredIcons = useMemo(() => {
    if (!searchQuery) return COMMON_ICONS;
    const lowerQuery = searchQuery.toLowerCase();
    return COMMON_ICONS.filter((name) => name.toLowerCase().includes(lowerQuery));
  }, [searchQuery]);

  const handleSelectIcon = (iconName: string) => {
    onChange(toUnocssName(iconName));
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={handleInputChange}
        className="h-8 text-sm flex-1"
        placeholder="e.g., i-lucide:activity"
      />
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Trigger asChild>
          <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
            {ActiveIconComponent ? (
              <ActiveIconComponent className="h-4 w-4" />
            ) : (
              <LucideIcons.Search className="h-4 w-4" />
            )}
          </Button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="z-50 w-64 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 p-2"
            sideOffset={4}
            align="end"
          >
            <div className="flex flex-col gap-2">
              <Input
                placeholder="Search icons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-sm"
              />
              <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto p-1">
                {filteredIcons.map((iconName) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const IconComp = (LucideIcons as any)[iconName];
                  if (!IconComp) return null;
                  const isSelected = value === toUnocssName(iconName);

                  return (
                    <button
                      key={iconName}
                      type="button"
                      title={iconName}
                      className={`flex items-center justify-center rounded-md p-1.5 hover:bg-accent hover:text-accent-foreground ${
                        isSelected ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                      }`}
                      onClick={() => handleSelectIcon(iconName)}
                    >
                      <IconComp className="h-4 w-4" />
                    </button>
                  );
                })}
                {filteredIcons.length === 0 && (
                  <div className="col-span-6 text-center text-xs text-muted-foreground py-4">
                    No icons found
                  </div>
                )}
              </div>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
