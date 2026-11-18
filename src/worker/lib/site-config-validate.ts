import type { SiteConfig } from '../../shared/site-config';

const SECTION_KINDS = [
  'hero',
  'stats',
  'feature-grid',
  'collection',
  'feed',
  'rail',
  'steps',
  'quote',
  'cta',
];
const PALETTE_KEYS = [
  'brand',
  'brandStrong',
  'ink',
  'inkMuted',
  'line',
  'surface',
  'surfaceMuted',
  'onBrand',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function checkString(
  holder: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[],
  required = false,
): void {
  const value = holder[key];
  if (value === undefined && !required) return;
  if (typeof value !== 'string') {
    errors.push(`${path} 必须是字符串`);
    return;
  }
  if (required && !value.trim()) errors.push(`${path} 不能为空`);
}

function checkPalette(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} 必须是对象`);
    return;
  }
  for (const key of PALETTE_KEYS) checkString(value, key, `${path}.${key}`, errors, true);
}

function checkSections(value: unknown, path: string, errors: string[]): void {
  if (!Array.isArray(value)) {
    errors.push(`${path} 必须是数组`);
    return;
  }
  if (value.length === 0) errors.push(`${path} 至少需要一个区块`);

  value.forEach((section, index) => {
    const at = `${path}[${index}]`;
    if (!isRecord(section)) {
      errors.push(`${at} 必须是对象`);
      return;
    }
    const kind = section.kind;
    if (typeof kind !== 'string' || !SECTION_KINDS.includes(kind)) {
      errors.push(`${at}.kind 必须是 ${SECTION_KINDS.join(' / ')} 之一`);
      return;
    }

    switch (kind) {
      case 'hero':
        checkString(section, 'title', `${at}.title`, errors, true);
        break;
      case 'feature-grid':
      case 'steps':
        checkString(section, 'title', `${at}.title`, errors, true);
        if (!Array.isArray(section.items) || section.items.length === 0) {
          errors.push(`${at}.items 至少需要一项`);
        }
        break;
      case 'collection':
        checkString(section, 'source', `${at}.source`, errors, true);
        checkString(section, 'title', `${at}.title`, errors, true);
        break;
      case 'feed':
        checkString(section, 'title', `${at}.title`, errors, true);
        break;
      case 'rail':
        if (!Array.isArray(section.cards) || section.cards.length === 0) {
          errors.push(`${at}.cards 至少需要一张卡片`);
        }
        break;
      case 'quote':
        checkString(section, 'text', `${at}.text`, errors, true);
        break;
      case 'cta':
        checkString(section, 'title', `${at}.title`, errors, true);
        break;
      case 'stats':
        if (!Array.isArray(section.items) || section.items.length === 0) {
          errors.push(`${at}.items 至少需要一项`);
        }
        break;
      default:
        break;
    }
  });
}

/**
 * 校验站点配置的结构，返回人类可读的问题列表。
 * 只做结构性校验，颜色、文案等具体取值允许自由填写。
 */
export function validateSiteConfig(value: unknown): string[] {
  const errors: string[] = [];

  if (!isRecord(value)) return ['配置必须是一个 JSON 对象'];

  const brand = value.brand;
  if (!isRecord(brand)) {
    errors.push('brand 必须是对象');
  } else {
    checkString(brand, 'name', 'brand.name', errors, true);
    checkString(brand, 'mark', 'brand.mark', errors, true);
    checkString(brand, 'tagline', 'brand.tagline', errors);
    checkString(brand, 'description', 'brand.description', errors);
  }

  const theme = value.theme;
  if (!isRecord(theme)) {
    errors.push('theme 必须是对象');
  } else {
    checkPalette(theme.light, 'theme.light', errors);
    checkPalette(theme.dark, 'theme.dark', errors);
    if (!isRecord(theme.fonts)) {
      errors.push('theme.fonts 必须是对象');
    } else {
      checkString(theme.fonts, 'sans', 'theme.fonts.sans', errors, true);
      checkString(theme.fonts, 'mono', 'theme.fonts.mono', errors, true);
    }
    checkString(theme, 'radius', 'theme.radius', errors, true);
    checkString(theme, 'maxWidth', 'theme.maxWidth', errors, true);
    if (theme.defaultMode !== 'light' && theme.defaultMode !== 'dark') {
      errors.push('theme.defaultMode 必须是 light 或 dark');
    }
  }

  const versions = value.versions;
  if (!Array.isArray(versions) || versions.length === 0) {
    errors.push('versions 至少需要一个版本');
  } else {
    versions.forEach((version, index) => {
      if (!isRecord(version)) {
        errors.push(`versions[${index}] 必须是对象`);
        return;
      }
      checkString(version, 'value', `versions[${index}].value`, errors, true);
      checkString(version, 'label', `versions[${index}].label`, errors, true);
    });
    const allowed = versions
      .filter(isRecord)
      .map((version) => version.value)
      .filter((item): item is string => typeof item === 'string');
    if (typeof value.defaultVersion !== 'string' || !allowed.includes(value.defaultVersion)) {
      errors.push('defaultVersion 必须出现在 versions 中');
    }
  }

  const nav = value.nav;
  if (!Array.isArray(nav)) {
    errors.push('nav 必须是数组');
  } else {
    nav.forEach((item, index) => {
      if (!isRecord(item)) {
        errors.push(`nav[${index}] 必须是对象`);
        return;
      }
      checkString(item, 'key', `nav[${index}].key`, errors, true);
      checkString(item, 'label', `nav[${index}].label`, errors, true);
      checkString(item, 'href', `nav[${index}].href`, errors, true);
    });
  }

  const header = value.header;
  if (!isRecord(header)) {
    errors.push('header 必须是对象');
  } else {
    for (const key of ['versionLabel', 'loginLabel', 'staffLabel', 'themeLabel', 'menuLabel']) {
      checkString(header, key, `header.${key}`, errors, true);
    }
  }

  const home = value.home;
  if (!isRecord(home)) {
    errors.push('home 必须是对象');
  } else {
    checkSections(home.sections, 'home.sections', errors);
  }

  const collections = value.collections;
  if (!isRecord(collections)) {
    errors.push('collections 必须是对象');
  } else {
    Object.entries(collections).forEach(([key, meta]) => {
      if (!isRecord(meta)) {
        errors.push(`collections.${key} 必须是对象`);
        return;
      }
      checkString(meta, 'title', `collections.${key}.title`, errors, true);
    });
  }

  const pages = value.pages;
  if (!isRecord(pages)) {
    errors.push('pages 必须是对象');
  } else {
    Object.entries(pages).forEach(([key, page]) => {
      if (!isRecord(page)) {
        errors.push(`pages.${key} 必须是对象`);
        return;
      }
      checkString(page, 'key', `pages.${key}.key`, errors, true);
      checkString(page, 'title', `pages.${key}.title`, errors, true);
      checkSections(page.sections, `pages.${key}.sections`, errors);
    });
  }

  const footer = value.footer;
  if (!isRecord(footer)) {
    errors.push('footer 必须是对象');
  } else {
    checkString(footer, 'note', 'footer.note', errors);
    checkString(footer, 'copyright', 'footer.copyright', errors);
    if (!Array.isArray(footer.columns)) errors.push('footer.columns 必须是数组');
  }

  const labels = value.labels;
  if (!isRecord(labels)) {
    errors.push('labels 必须是对象');
  } else {
    Object.entries(labels).forEach(([key, label]) => {
      if (typeof label !== 'string') errors.push(`labels.${key} 必须是字符串`);
    });
  }

  return errors;
}

export function parseSiteConfig(value: unknown): SiteConfig {
  return value as SiteConfig;
}
