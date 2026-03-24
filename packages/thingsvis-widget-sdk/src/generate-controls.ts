import type { z } from 'zod';
import type {
  ControlBinding,
  ControlField,
  ControlGroup,
  ControlGroupId,
  WidgetControls,
} from './types';
import {
  getEnumOptions,
  getZodDefault,
  getZodDescription,
  zodTypeToKind,
} from './utils/zod-helpers';

export type GenerateControlsConfig = {
  groups?: Partial<Record<ControlGroupId, string[]>>;
  groupOptions?: Partial<Record<ControlGroupId, { label?: string; expanded?: boolean }>>;
  overrides?: Record<string, Partial<ControlField>>;
  bindings?: Record<string, ControlBinding>;
  enableAllBindings?: boolean;
  exclude?: string[];
};

type ZodShape = Record<string, z.ZodTypeAny>;

export function generateControls(
  schema: z.ZodObject<ZodShape>,
  config: GenerateControlsConfig = {}
): WidgetControls {
  const shape = schema.shape;
  const {
    groups: groupConfig = {},
    groupOptions = {},
    overrides = {},
    bindings = {},
    enableAllBindings = false,
    exclude = [],
  } = config;

  const defaultBinding: ControlBinding = { enabled: true, modes: ['static', 'field', 'expr'] };
  const allFields: Record<string, ControlField> = {};

  for (const [key, zodType] of Object.entries(shape)) {
    if (exclude.includes(key)) continue;

    allFields[key] = {
      path: key,
      label: getZodDescription(zodType) ?? key,
      kind: zodTypeToKind(zodType),
      default: getZodDefault(zodType),
      options: getEnumOptions(zodType),
      binding: enableAllBindings ? defaultBinding : bindings[key],
      ...overrides[key],
    };
  }

  const groups: ControlGroup[] = [];
  const usedKeys = new Set<string>();
  const groupOrder: ControlGroupId[] = ['Content', 'Style', 'Data', 'Advanced'];

  for (const groupId of groupOrder) {
    const fieldKeys = groupConfig[groupId];
    if (!fieldKeys || fieldKeys.length === 0) continue;

    const fields = fieldKeys
      .map((key) => allFields[key])
      .filter((field): field is ControlField => field !== undefined);

    fields.forEach((field) => usedKeys.add(field.path));

    if (fields.length === 0) continue;

    const options = groupOptions[groupId];
    groups.push({
      id: groupId,
      label: options?.label ?? getGroupLabel(groupId),
      expanded: options?.expanded ?? (groupId === 'Advanced' ? false : true),
      fields,
    });
  }

  const remainingFields = Object.entries(allFields)
    .filter(([key]) => !usedKeys.has(key))
    .map(([, field]) => field);

  if (remainingFields.length > 0) {
    const advancedGroup = groups.find((group) => group.id === 'Advanced');
    if (advancedGroup) {
      advancedGroup.fields.push(...remainingFields);
    } else {
      const options = groupOptions.Advanced;
      groups.push({
        id: 'Advanced',
        label: options?.label ?? 'Advanced',
        expanded: options?.expanded ?? false,
        fields: remainingFields,
      });
    }
  }

  return { groups };
}

function getGroupLabel(id: ControlGroupId): string {
  return id;
}
