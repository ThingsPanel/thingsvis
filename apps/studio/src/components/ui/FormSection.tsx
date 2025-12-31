/**
 * FormSection: Collapsible form section with title
 * 
 * A reusable wrapper component for grouping form fields with an optional
 * collapsible header and description text.
 * 
 * @feature 009-datasource-form-config
 */

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FormSectionProps {
  /** Section title displayed in the header */
  title: string;
  /** Optional description text below the title */
  description?: string;
  /** Whether the section starts collapsed (default: false) */
  defaultCollapsed?: boolean;
  /** Whether the section is collapsible at all (default: true) */
  collapsible?: boolean;
  /** Section content */
  children: React.ReactNode;
  /** Additional className for the wrapper */
  className?: string;
}

export function FormSection({
  title,
  description,
  defaultCollapsed = false,
  collapsible = true,
  children,
  className,
}: FormSectionProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  const handleToggle = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <div className={cn('border rounded-sm bg-card', className)}>
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3',
          collapsible && 'cursor-pointer hover:bg-accent/50',
          !isCollapsed && 'border-b'
        )}
        onClick={handleToggle}
        role={collapsible ? 'button' : undefined}
        aria-expanded={collapsible ? !isCollapsed : undefined}
      >
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-medium">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {collapsible && (
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform',
              isCollapsed && '-rotate-90'
            )}
          />
        )}
      </div>
      
      {/* Content */}
      {!isCollapsed && (
        <div className="p-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}
