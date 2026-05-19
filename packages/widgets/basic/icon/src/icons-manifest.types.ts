export type LocalIconCategory = {
  id: string;
  name: string;
};

export type LocalIconEntry = {
  id: string;
  categoryId: string;
  name: string;
  file: string;
  kind: 'svg' | 'image';
  ext: string;
  width?: number;
  height?: number;
};

export type LocalIconsManifest = {
  version: number;
  generatedAt: string;
  basePath: string;
  categories: LocalIconCategory[];
  icons: LocalIconEntry[];
};
