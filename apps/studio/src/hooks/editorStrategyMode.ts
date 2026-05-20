export function shouldUseWidgetMode(options: {
  embedded: boolean;
  saveTarget: string;
  context?: string;
}): boolean {
  return options.embedded && options.saveTarget === 'host' && options.context !== 'dashboard';
}
