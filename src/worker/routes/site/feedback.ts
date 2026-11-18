// 页面纠错反馈：提交（含蜜罐与限流）与进度查询
import { Hono } from 'hono';
import type { AppEnv } from '../../lib/env';
import { randomToken, sha256Hex } from '../../lib/crypto';
import { asString, fail, readJson } from '../../lib/http';
import { newId, nowIso } from '../../lib/ids';
import { consumeRateLimit } from '../../lib/rate-limit';
import { EMAIL_PATTERN } from '../../lib/validation';
import {
  clientIp,
  MAX_NOTE_LENGTH,
  normalizeUrl,
  normalizeVersionChoice,
  SUBMISSION_TOKEN_TTL_MS,
} from './shared';

export const feedbackRoutes = new Hono<AppEnv>();

interface FeedbackTokenRow {
  id: string;
  page_url: string;
  status: string;
  created_at: string;
  updated_at: string;
}

feedbackRoutes.post('/feedback', async (c) => {
  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  if (asString(body.website).trim()) return c.json({ ok: true, id: null }, 201);

  const pageUrl = normalizeUrl(asString(body.page_url), true);
  if (!pageUrl) return fail(c, 400, 'invalid_page_url', '需要提供页面地址');

  const text = asString(body.body).trim();
  if (!text) return fail(c, 400, 'invalid_body', '请描述遇到的问题');
  if (text.length > MAX_NOTE_LENGTH) {
    return fail(c, 400, 'body_too_long', '问题描述不能超过 4000 个字符');
  }

  const email = asString(body.email).trim();
  if (email && (!EMAIL_PATTERN.test(email) || email.length > 200)) {
    return fail(c, 400, 'invalid_email', '请填写有效的邮箱');
  }

  if (!(await consumeRateLimit(c.env, `feedback:${clientIp(c)}`, 10, 3600))) {
    return fail(c, 429, 'rate_limited', '提交太频繁，请稍后再试');
  }

  const id = newId('fb');
  const now = nowIso();
  const accessToken = randomToken();

  await c.env.DB.prepare(
    `INSERT INTO feedback
       (id, page_url, version, body, email, status, access_token_hash, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'open', ?, ?, ?)`,
  )
    .bind(
      id,
      pageUrl,
      await normalizeVersionChoice(asString(body.version), c),
      text,
      email || null,
      await sha256Hex(accessToken),
      now,
      now,
    )
    .run();

  return c.json(
    {
      ok: true,
      id,
      status_url: `/feedback/status?token=${encodeURIComponent(accessToken)}`,
    },
    201,
  );
});

feedbackRoutes.get('/feedback/status', async (c) => {
  const token = (c.req.query('token') ?? '').trim();
  if (!token) return fail(c, 400, 'invalid_token', '查询链接不完整');

  const row = await c.env.DB.prepare(
    `SELECT id, page_url, status, created_at, updated_at
     FROM feedback WHERE access_token_hash = ?`,
  )
    .bind(await sha256Hex(token))
    .first<FeedbackTokenRow>();

  if (!row) return fail(c, 404, 'status_invalid', '查询链接无效，请检查提交后返回的地址');
  if (Date.parse(row.created_at) + SUBMISSION_TOKEN_TTL_MS <= Date.now()) {
    return fail(c, 410, 'status_expired', '查询链接已过期');
  }

  return c.json({ feedback: row });
});
