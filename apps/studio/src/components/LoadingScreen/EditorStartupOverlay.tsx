import LoadingScreen from './LoadingScreen';
import { useTranslation } from 'react-i18next';
import type { EditorStartupState } from '@/hooks/useEditorStartup';

export interface EditorStartupOverlayProps {
  startup: EditorStartupState;
  visible: boolean;
}

export default function EditorStartupOverlay({ startup, visible }: EditorStartupOverlayProps) {
  const { t } = useTranslation('common');

  if (!visible) {
    return null;
  }

  return <LoadingScreen progress={startup.progress} statusText={t(startup.statusKey)} />;
}
