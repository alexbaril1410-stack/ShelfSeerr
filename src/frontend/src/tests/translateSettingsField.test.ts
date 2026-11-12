import { describe, expect, it } from 'vitest';

import type { SettingsField } from '../types/settings';
import { translateSettingsField } from '../components/settings/translateSettingsField';

const translations: Record<string, string> = {
  Search: 'Recherche',
  'Choose a provider': 'Choisissez un fournisseur',
  Hardcover: 'Hardcover traduit',
  'Select a provider': 'Sélectionnez un fournisseur',
  'Add mapping': 'Ajouter une correspondance',
  'No mappings configured': 'Aucune correspondance configurée',
  Host: 'Hôte',
};

const t = (value: string) => translations[value] ?? value;

describe('translateSettingsField', () => {
  it('translates field labels and option copy without changing API keys or values', () => {
    const field: SettingsField = {
      type: 'SelectField',
      key: 'METADATA_PROVIDER',
      label: 'Search',
      description: 'Choose a provider',
      value: 'hardcover',
      options: [{ value: 'hardcover', label: 'Hardcover' }],
    };

    const translated = translateSettingsField(field, t);

    expect(translated).toMatchObject({
      key: 'METADATA_PROVIDER',
      label: 'Recherche',
      description: 'Choisissez un fournisseur',
      value: 'hardcover',
      options: [{ value: 'hardcover', label: 'Hardcover traduit' }],
    });
  });

  it('translates table labels while preserving column keys and option values', () => {
    const field: SettingsField = {
      type: 'TableField',
      key: 'PATH_MAPPINGS',
      label: 'Search',
      value: [],
      addLabel: 'Add mapping',
      emptyMessage: 'No mappings configured',
      columns: [
        {
          key: 'host',
          label: 'Host',
          type: 'text',
          options: [{ value: 'remote', label: 'Hardcover' }],
        },
      ],
    };

    const translated = translateSettingsField(field, t);

    expect(translated).toMatchObject({
      key: 'PATH_MAPPINGS',
      addLabel: 'Ajouter une correspondance',
      emptyMessage: 'Aucune correspondance configurée',
      columns: [
        {
          key: 'host',
          label: 'Hôte',
          options: [{ value: 'remote', label: 'Hardcover traduit' }],
        },
      ],
    });
  });

  it('translates nested fields in custom settings components', () => {
    const field: SettingsField = {
      type: 'CustomComponentField',
      key: 'CUSTOM',
      label: 'Search',
      component: 'custom',
      boundFields: [
        {
          type: 'SelectField',
          key: 'PROVIDER',
          label: 'Search',
          value: 'hardcover',
          options: [{ value: 'hardcover', label: 'Hardcover' }],
        },
      ],
    };

    const translated = translateSettingsField(field, t);

    expect(translated).toMatchObject({
      key: 'CUSTOM',
      boundFields: [
        {
          key: 'PROVIDER',
          label: 'Recherche',
          value: 'hardcover',
          options: [{ value: 'hardcover', label: 'Hardcover traduit' }],
        },
      ],
    });
  });
});
