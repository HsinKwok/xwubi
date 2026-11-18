import { useEffect, useState } from 'react';
import { resolveAdminError } from '../../lib/api';
import { loadCategories, subscribeCategories } from '../../lib/categories-cache';
import type { CategoryItem } from '../../lib/categories-api';
import { getSettings, saveSettings } from '../../lib/settings-api';
import { applyVersionsFromConfig } from '../../lib/versions';
import type { SiteConfig } from '../../../shared/site-config';

interface Notice {
  tone: 'ok' | 'error';
  text: string;
}

type Mode = 'form' | 'json';

interface Options {
  isAdmin: boolean;
  onUnauthorized: () => void;
}

/**
 * 站点设置的加载、表单/JSON 双模式编辑与保存逻辑。
 */
export function useSiteSettings({ isAdmin, onUnauthorized }: Options) {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [epoch, setEpoch] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [mode, setMode] = useState<Mode>('form');
  const [raw, setRaw] = useState('');
  const [rawError, setRawError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [contentTypes, setContentTypes] = useState<CategoryItem[]>([]);

  // 内容类型来自分类缓存：分类新增/改名后设置页无需刷新即可拿到最新选项
  useEffect(() => {
    const controller = new AbortController();

    const applyContentTypes = () => {
      loadCategories('content_type', controller.signal)
        .then((payload) => {
          if (!controller.signal.aborted) setContentTypes(payload.items);
        })
        .catch((caught: unknown) => {
          if (controller.signal.aborted) return;
          resolveAdminError(caught, '内容类型加载失败', onUnauthorized);
        });
    };

    applyContentTypes();
    const unsubscribe = subscribeCategories(applyContentTypes);

    return () => {
      controller.abort();
      unsubscribe();
    };
  }, [onUnauthorized]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);

    getSettings(controller.signal)
      .then((payload) => {
        if (controller.signal.aborted) return;
        setConfig(payload.config);
        setEpoch(payload.epoch);
        setUpdatedAt(payload.updated_at);
        setRaw(JSON.stringify(payload.config, null, 2));
        setLoading(false);
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        const message = resolveAdminError(caught, '站点配置加载失败', onUnauthorized);
        if (!message) return;
        setLoadError(message);
        setLoading(false);
      });

    return () => controller.abort();
  }, [reloadKey, onUnauthorized]);

  function update(mutator: (draft: SiteConfig) => void) {
    setConfig((prev) => {
      if (!prev) return prev;
      const draft = structuredClone(prev);
      mutator(draft);
      return draft;
    });
    setNotice(null);
  }

  function handleError(caught: unknown) {
    const message = resolveAdminError(caught, '保存失败，请重试', onUnauthorized);
    if (!message) return;
    setNotice({ tone: 'error', text: message });
  }

  function switchMode(next: Mode) {
    if (next === mode) return;
    setRawError(null);

    if (next === 'json') {
      if (config) setRaw(JSON.stringify(config, null, 2));
      setMode('json');
      return;
    }

    try {
      setConfig(JSON.parse(raw) as SiteConfig);
      setMode('form');
    } catch {
      setRawError('JSON 语法错误，修正后才能回到表单模式。');
    }
  }

  async function handleSave() {
    if (!isAdmin || saving) return;

    let target = config;
    if (mode === 'json') {
      try {
        target = JSON.parse(raw) as SiteConfig;
      } catch {
        setRawError('JSON 语法错误，请检查逗号与引号。');
        return;
      }
    }
    if (!target) return;

    setSaving(true);
    setNotice(null);
    setRawError(null);

    try {
      const payload = await saveSettings(target);
      setConfig(payload.config);
      setEpoch(payload.epoch);
      setUpdatedAt(payload.updated_at);
      setRaw(JSON.stringify(payload.config, null, 2));
      // 保存接口已返回最新配置，直接同步版本清单，不用再请求 /versions
      applyVersionsFromConfig(payload.config);
      setNotice({ tone: 'ok', text: '站点配置已保存，前台会在缓存刷新后使用新配置。' });
    } catch (caught) {
      handleError(caught);
    } finally {
      setSaving(false);
    }
  }

  function reload() {
    setReloadKey((key) => key + 1);
  }

  return {
    config,
    epoch,
    updatedAt,
    loading,
    loadError,
    mode,
    raw,
    setRaw,
    rawError,
    setRawError,
    saving,
    notice,
    contentTypes,
    update,
    switchMode,
    handleSave,
    reload,
  };
}
