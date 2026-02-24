/**
 * ControlPanelBuilder - Builder Pattern 控件面板配置
 * 
 * 借鉴 Grafana 的 PanelOptionsBuilder 设计
 * 提供链式调用 API，IDE 友好
 */

import type {
  ControlField,
  ControlGroup,
  ControlGroupId,
  ControlKind,
  ControlOption,
  ControlBinding,
  WidgetControls,
} from './types';

// ============================================================================
// 字段构建器
// ============================================================================

/** 添加控件的通用选项 */
export type AddControlOptions = {
  label?: string;
  description?: string;
  placeholder?: string;
  default?: unknown;
  binding?: boolean | ControlBinding;
  disabled?: boolean;
  showWhen?: { field: string; value: unknown };
};

/** 数值控件选项 */
export type AddNumberOptions = AddControlOptions & {
  min?: number;
  max?: number;
  step?: number;
};

/** 选择控件选项 */
export type AddSelectOptions = AddControlOptions & {
  options: ControlOption[];
};

/** Slider 控件选项 */
export type AddSliderOptions = AddControlOptions & {
  min: number;
  max: number;
  step?: number;
};

/**
 * 字段构建器
 * 
 * 用于在分组内添加控件字段
 */
export class FieldBuilder {
  private fields: ControlField[] = [];
  private defaultBinding: ControlBinding = { enabled: true, modes: ['static', 'field', 'expr'] };

  /** 获取所有字段 */
  getFields(): ControlField[] {
    return this.fields;
  }

  /** 解析绑定配置 */
  private resolveBinding(binding?: boolean | ControlBinding): ControlBinding | undefined {
    if (binding === true) return this.defaultBinding;
    if (typeof binding === 'object') return binding;
    return undefined;
  }

  /** 添加文本输入 */
  addTextInput(path: string, options: AddControlOptions = {}): this {
    this.fields.push({
      path,
      label: options.label ?? path,
      kind: 'string',
      default: options.default,
      placeholder: options.placeholder,
      description: options.description,
      binding: this.resolveBinding(options.binding),
      disabled: options.disabled,
      showWhen: options.showWhen,
    });
    return this;
  }

  /** 添加数值输入 */
  addNumberInput(path: string, options: AddNumberOptions = {}): this {
    this.fields.push({
      path,
      label: options.label ?? path,
      kind: 'number',
      default: options.default,
      placeholder: options.placeholder,
      description: options.description,
      binding: this.resolveBinding(options.binding),
      disabled: options.disabled,
      showWhen: options.showWhen,
      min: options.min,
      max: options.max,
      step: options.step,
    });
    return this;
  }

  /** 添加开关 */
  addSwitch(path: string, options: AddControlOptions = {}): this {
    this.fields.push({
      path,
      label: options.label ?? path,
      kind: 'boolean',
      default: options.default ?? false,
      description: options.description,
      binding: this.resolveBinding(options.binding),
      disabled: options.disabled,
      showWhen: options.showWhen,
    });
    return this;
  }

  /** 添加颜色选择器 */
  addColorPicker(path: string, options: AddControlOptions = {}): this {
    this.fields.push({
      path,
      label: options.label ?? path,
      kind: 'color',
      default: options.default ?? '#000000',
      description: options.description,
      binding: this.resolveBinding(options.binding),
      disabled: options.disabled,
      showWhen: options.showWhen,
    });
    return this;
  }

  /** 添加渐变选择器 */
  addGradientPicker(path: string, options: AddControlOptions = {}): this {
    this.fields.push({
      path,
      label: options.label ?? path,
      kind: 'gradient',
      default: options.default,
      description: options.description,
      binding: this.resolveBinding(options.binding),
      disabled: options.disabled,
      showWhen: options.showWhen,
    });
    return this;
  }

  /** 添加下拉选择 */
  addSelect(path: string, options: AddSelectOptions): this {
    this.fields.push({
      path,
      label: options.label ?? path,
      kind: 'select',
      default: options.default,
      options: options.options,
      description: options.description,
      binding: this.resolveBinding(options.binding),
      disabled: options.disabled,
      showWhen: options.showWhen,
    });
    return this;
  }

  /** 添加多选 */
  addMultiSelect(path: string, options: AddSelectOptions): this {
    this.fields.push({
      path,
      label: options.label ?? path,
      kind: 'multiSelect',
      default: options.default ?? [],
      options: options.options,
      description: options.description,
      binding: this.resolveBinding(options.binding),
      disabled: options.disabled,
      showWhen: options.showWhen,
    });
    return this;
  }

  /** 添加单选按钮组 */
  addRadio(path: string, options: AddSelectOptions): this {
    this.fields.push({
      path,
      label: options.label ?? path,
      kind: 'radio',
      default: options.default,
      options: options.options,
      description: options.description,
      binding: this.resolveBinding(options.binding),
      disabled: options.disabled,
      showWhen: options.showWhen,
    });
    return this;
  }

  /** 添加分段控制器 */
  addSegmented(path: string, options: AddSelectOptions): this {
    this.fields.push({
      path,
      label: options.label ?? path,
      kind: 'segmented',
      default: options.default,
      options: options.options,
      description: options.description,
      binding: this.resolveBinding(options.binding),
      disabled: options.disabled,
      showWhen: options.showWhen,
    });
    return this;
  }

  /** 添加 JSON 编辑器 */
  addJsonEditor(path: string, options: AddControlOptions = {}): this {
    this.fields.push({
      path,
      label: options.label ?? path,
      kind: 'json',
      default: options.default ?? {},
      description: options.description,
      binding: this.resolveBinding(options.binding),
      disabled: options.disabled,
      showWhen: options.showWhen,
    });
    return this;
  }

  /** 添加代码编辑器 */
  addCodeEditor(path: string, options: AddControlOptions = {}): this {
    this.fields.push({
      path,
      label: options.label ?? path,
      kind: 'code',
      default: options.default ?? '',
      description: options.description,
      binding: this.resolveBinding(options.binding),
      disabled: options.disabled,
      showWhen: options.showWhen,
    });
    return this;
  }

  /** 添加表达式输入 */
  addExpressionInput(path: string, options: AddControlOptions = {}): this {
    this.fields.push({
      path,
      label: options.label ?? path,
      kind: 'expression',
      default: options.default ?? '',
      placeholder: options.placeholder ?? '{{ ds.data.value }}',
      description: options.description,
      binding: this.resolveBinding(options.binding),
      disabled: options.disabled,
      showWhen: options.showWhen,
    });
    return this;
  }

  /** 添加图片选择器 */
  addImagePicker(path: string, options: AddControlOptions = {}): this {
    this.fields.push({
      path,
      label: options.label ?? path,
      kind: 'image',
      default: options.default ?? '',
      description: options.description,
      binding: this.resolveBinding(options.binding),
      disabled: options.disabled,
      showWhen: options.showWhen,
    });
    return this;
  }

  /** 添加图标选择器 */
  addIconPicker(path: string, options: AddControlOptions = {}): this {
    this.fields.push({
      path,
      label: options.label ?? path,
      kind: 'icon',
      default: options.default ?? '',
      description: options.description,
      binding: this.resolveBinding(options.binding),
      disabled: options.disabled,
      showWhen: options.showWhen,
    });
    return this;
  }

  /** 添加滑块 */
  addSlider(path: string, options: AddSliderOptions): this {
    this.fields.push({
      path,
      label: options.label ?? path,
      kind: 'slider',
      default: options.default ?? options.min,
      description: options.description,
      binding: this.resolveBinding(options.binding),
      disabled: options.disabled,
      showWhen: options.showWhen,
      min: options.min,
      max: options.max,
      step: options.step ?? 1,
    });
    return this;
  }

  /** 添加节点选择器 */
  addNodeSelect(path: string, options: AddControlOptions = {}): this {
    this.fields.push({
      path,
      label: options.label ?? path,
      kind: 'nodeSelect',
      default: options.default ?? '',
      description: options.description,
      binding: this.resolveBinding(options.binding),
      disabled: options.disabled,
      showWhen: options.showWhen,
    });
    return this;
  }

  /** 添加数据源选择器 */
  addDataSourceSelect(path: string, options: AddControlOptions = {}): this {
    this.fields.push({
      path,
      label: options.label ?? path,
      kind: 'dataSource',
      default: options.default ?? '',
      description: options.description,
      binding: this.resolveBinding(options.binding),
      disabled: options.disabled,
      showWhen: options.showWhen,
    });
    return this;
  }

  /** 添加数据字段选择器 */
  addDataFieldSelect(path: string, options: AddControlOptions = {}): this {
    this.fields.push({
      path,
      label: options.label ?? path,
      kind: 'dataField',
      default: options.default ?? '',
      description: options.description,
      binding: this.resolveBinding(options.binding),
      disabled: options.disabled,
      showWhen: options.showWhen,
    });
    return this;
  }

  /** 添加自定义控件 */
  addCustom(path: string, kind: ControlKind, options: AddControlOptions = {}): this {
    this.fields.push({
      path,
      label: options.label ?? path,
      kind,
      default: options.default,
      placeholder: options.placeholder,
      description: options.description,
      binding: this.resolveBinding(options.binding),
      disabled: options.disabled,
      showWhen: options.showWhen,
    });
    return this;
  }
}

// ============================================================================
// 面板构建器
// ============================================================================

/** 标准选项类型 */
export type StandardOption = 'opacity' | 'shadow' | 'border' | 'background' | 'transform';

/**
 * 控件面板构建器
 * 
 * @example
 * ```typescript
 * const controls = createControlPanel()
 *   .useStandardOptions(['opacity', 'shadow'])
 *   .addGroup('Content', (builder) => {
 *     builder
 *       .addTextInput('title', { label: '标题', binding: true })
 *       .addJsonEditor('data', { label: '数据', binding: true });
 *   })
 *   .addGroup('Style', (builder) => {
 *     builder
 *       .addColorPicker('lineColor', { label: '线条颜色', binding: true })
 *       .addSwitch('smooth', { label: '平滑曲线' });
 *   })
 *   .build();
 * ```
 */
export class ControlPanelBuilder {
  private groups: ControlGroup[] = [];
  private standardOptions: StandardOption[] = [];

  /** 使用标准选项（自动添加通用控件） */
  useStandardOptions(options: StandardOption[]): this {
    this.standardOptions = options;
    return this;
  }

  /** 添加分组 */
  addGroup(
    id: ControlGroupId | string,
    builderFn: (builder: FieldBuilder) => void,
    options: { label?: string; expanded?: boolean } = {}
  ): this {
    const fieldBuilder = new FieldBuilder();
    builderFn(fieldBuilder);

    this.groups.push({
      id,
      label: options.label ?? this.getDefaultLabel(id),
      expanded: options.expanded ?? true,
      fields: fieldBuilder.getFields(),
    });

    return this;
  }

  /** 添加内容分组（快捷方法） */
  addContentGroup(builderFn: (builder: FieldBuilder) => void): this {
    return this.addGroup('Content', builderFn, { label: '内容' });
  }

  /** 添加样式分组（快捷方法） */
  addStyleGroup(builderFn: (builder: FieldBuilder) => void): this {
    return this.addGroup('Style', builderFn, { label: '样式' });
  }

  /** 添加数据分组（快捷方法） */
  addDataGroup(builderFn: (builder: FieldBuilder) => void): this {
    return this.addGroup('Data', builderFn, { label: '数据' });
  }

  /** 添加高级分组（快捷方法） */
  addAdvancedGroup(builderFn: (builder: FieldBuilder) => void): this {
    return this.addGroup('Advanced', builderFn, { label: '高级', expanded: false });
  }

  /** 构建最终配置 */
  build(): WidgetControls {
    const allGroups = [...this.groups];

    // 添加标准选项分组（如果有）
    if (this.standardOptions.length > 0) {
      const standardFields: ControlField[] = [];

      if (this.standardOptions.includes('opacity')) {
        standardFields.push({
          path: '_opacity',
          label: '不透明度',
          kind: 'slider',
          default: 1,
          min: 0,
          max: 1,
          step: 0.01,
        });
      }

      if (this.standardOptions.includes('background')) {
        standardFields.push({
          path: '_backgroundColor',
          label: '背景色',
          kind: 'color',
          default: 'transparent',
        });
      }

      if (this.standardOptions.includes('border')) {
        standardFields.push(
          { path: '_borderWidth', label: '边框宽度', kind: 'number', default: 0, min: 0, max: 20 },
          { path: '_borderColor', label: '边框颜色', kind: 'color', default: '#000000' },
          { path: '_borderRadius', label: '圆角', kind: 'number', default: 0, min: 0, max: 100 }
        );
      }

      if (this.standardOptions.includes('shadow')) {
        standardFields.push(
          { path: '_shadowEnabled', label: '启用阴影', kind: 'boolean', default: false },
          { path: '_shadowColor', label: '阴影颜色', kind: 'color', default: 'rgba(0,0,0,0.2)', showWhen: { field: '_shadowEnabled', value: true } },
          { path: '_shadowBlur', label: '阴影模糊', kind: 'number', default: 10, min: 0, max: 50, showWhen: { field: '_shadowEnabled', value: true } }
        );
      }

      if (standardFields.length > 0) {
        allGroups.push({
          id: 'Standard',
          label: '通用',
          expanded: false,
          fields: standardFields,
        });
      }
    }

    return { groups: allGroups };
  }

  /** 获取默认分组标签 */
  private getDefaultLabel(id: string): string {
    const labels: Record<string, string> = {
      Content: '内容',
      Style: '样式',
      Data: '数据',
      Advanced: '高级',
    };
    return labels[id] ?? id;
  }
}

/**
 * 创建控件面板构建器
 */
export function createControlPanel(): ControlPanelBuilder {
  return new ControlPanelBuilder();
}
