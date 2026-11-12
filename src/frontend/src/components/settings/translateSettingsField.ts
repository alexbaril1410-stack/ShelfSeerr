import type {
  SettingsField,
  SelectFieldConfig,
  MultiSelectFieldConfig,
  OrderableListFieldConfig,
  TableFieldConfig,
  CustomComponentFieldConfig,
} from '../../types/settings';

type Translate = (value: string) => string;

const translateOption = <T extends { label: string; description?: string; disabledReason?: string }>(
  option: T,
  t: Translate,
): T => ({
  ...option,
  label: t(option.label),
  description: option.description ? t(option.description) : undefined,
  disabledReason: option.disabledReason ? t(option.disabledReason) : undefined,
});

/**
 * Translate only presentation strings received from the settings API.
 * Keys, option values and persisted configuration data remain untouched.
 */
export const translateSettingsField = (
  field: SettingsField,
  t: Translate,
): SettingsField => {
  if (field.type === 'HeadingField') {
    return {
      ...field,
      title: t(field.title),
      description: field.description ? t(field.description) : undefined,
      descriptionByAuthMode: field.descriptionByAuthMode
        ? Object.fromEntries(
            Object.entries(field.descriptionByAuthMode).map(([mode, description]) => [
              mode,
              t(description),
            ]),
          )
        : undefined,
      linkText: field.linkText ? t(field.linkText) : undefined,
    };
  }

  const base = {
    ...field,
    label: t(field.label),
    description: field.description ? t(field.description) : undefined,
    disabledReason: field.disabledReason ? t(field.disabledReason) : undefined,
    ...('placeholder' in field
      ? { placeholder: field.placeholder ? t(field.placeholder) : undefined }
      : {}),
  };

  switch (field.type) {
    case 'SelectField':
      return {
        ...base,
        options: field.options.map((option) => translateOption(option, t)),
      } as SelectFieldConfig;
    case 'MultiSelectField':
      return {
        ...base,
        options: field.options.map((option) => translateOption(option, t)),
      } as MultiSelectFieldConfig;
    case 'OrderableListField':
      return {
        ...base,
        options: field.options.map((option) => translateOption(option, t)),
      } as OrderableListFieldConfig;
    case 'TableField':
      return {
        ...base,
        addLabel: field.addLabel ? t(field.addLabel) : undefined,
        emptyMessage: field.emptyMessage ? t(field.emptyMessage) : undefined,
        columns: field.columns.map((column) => ({
          ...column,
          label: t(column.label),
          placeholder: column.placeholder ? t(column.placeholder) : undefined,
          options: column.options?.map((option) => ({
            ...option,
            label: t(option.label),
            description: option.description ? t(option.description) : undefined,
          })),
        })),
      } as TableFieldConfig;
    case 'CustomComponentField':
      return {
        ...base,
        boundFields: field.boundFields?.map((boundField) =>
          translateSettingsField(boundField, t),
        ),
      } as CustomComponentFieldConfig;
    default:
      return base as SettingsField;
  }
};
