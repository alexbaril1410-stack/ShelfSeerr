import type { SettingsField } from '../../types/settings';

type Translate = (value: string) => string;

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
    };
  }

  const translated = {
    ...field,
    label: t(field.label),
    description: field.description ? t(field.description) : undefined,
    disabledReason: field.disabledReason ? t(field.disabledReason) : undefined,
    placeholder: 'placeholder' in field && field.placeholder ? t(field.placeholder) : undefined,
  } as SettingsField;

  if ('options' in field) {
    return {
      ...translated,
      options: field.options.map((option) => ({
        ...option,
        label: t(option.label),
        description: option.description ? t(option.description) : undefined,
        disabledReason:
          'disabledReason' in option && option.disabledReason
            ? t(option.disabledReason)
            : undefined,
      })),
    } as SettingsField;
  }

  if (field.type === 'TableField') {
    return {
      ...translated,
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
    };
  }

  if (field.type === 'CustomComponentField' && field.boundFields) {
    return {
      ...translated,
      boundFields: field.boundFields.map((boundField) => translateSettingsField(boundField, t)),
    };
  }

  return translated;
};
