// 前台投稿接口：提交（含蜜罐与限流）、邮件确认与进度查询
import { Hono } from 'hono';
import type { AppEnv } from '../../lib/env';
import { randomToken, sha256Hex } from '../../lib/crypto';
import { asString, fail, readJson } from '../../lib/http';
import { newId, nowIso } from '../../lib/ids';
import { requestOrigin, sendMail, submissionConfirmMail } from '../../lib/mailer';
import { consumeRateLimit } from '../../lib/rate-limit';
import { EMAIL_PATTERN, SUBMISSION_KINDS } from '../../lib/validation';
import {
  clientIp,
  defer,
  MAX_NOTE_LENGTH,
  normalizeUrl,
  normalizeVersionChoice,
  SUBMISSION_TOKEN_TTL_MS,
} from './shared';

export const submissionRoutes = new Hono<AppEnv>();

interface SubmissionTokenRow {
  id: string;
  kind: string;
  title: string;
  status: string;
  reject_reason: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

submissionRoutes.post('/submissions', async (c) => {
  const body = await readJson<Record<string, unknown>>(c);
  if (!body) return fail(c, 400, 'invalid_request', '请求体必须是 JSON');

  // 蜜罐字段：正常用户看不到，命中后直接返回成功但不入库
  if (asString(body.website).trim()) return c.json({ ok: true, id: null }, 201);

  const kind = asString(body.kind) || 'news';
  if (!SUBMISSION_KINDS.includes(kind)) {
    return fail(c, 400, 'invalid_kind', '投稿类型不合法');
  }

  const title = asString(body.title).trim();
  if (!title) return fail(c, 400, 'invalid_title', '标题不能为空');
  if (title.length > 160) return fail(c, 400, 'invalid_title', '标题不能超过 160 个字符');

  const email = asString(body.email).trim();
  if (!EMAIL_PATTERN.test(email) || email.length > 200) {
    return fail(c, 400, 'invalid_email', '请填写有效的邮箱');
  }

  const note = asString(body.note).trim();
  if (note.length > MAX_NOTE_LENGTH) {
    return fail(c, 400, 'note_too_long', '补充说明不能超过 4000 个字符');
  }

  const displayName = asString(body.display_name).trim();
  if (displayName.length > 60) {
    return fail(c, 400, 'name_too_long', '称呼不能超过 60 个字符');
  }

  const url = normalizeUrl(asString(body.url), false);
  if (url === null) return fail(c, 400, 'invalid_url', '链接需要以 http:// 或 https:// 开头');

  const pageUrl = normalizeUrl(asString(body.page_url), true);
  if (pageUrl === null) return fail(c, 400, 'invalid_page_url', '页面地址不合法');

  if (!(await consumeRateLimit(c.env, `submission:${clientIp(c)}`, 5, 3600))) {
    return fail(c, 429, 'rate_limited', '提交太频繁，请稍后再试');
  }

  const id = newId('sub');
  const now = nowIso();
  const confirmToken = randomToken();
  const accessToken = randomToken();

  await c.env.DB.prepare(
    `INSERT INTO submissions
       (id, kind, title, url, page_url, version, note, email, display_name, status,
        confirm_token_hash, access_token_hash, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?, ?)`,
  )
    .bind(
      id,
      kind,
      title,
      url || null,
      pageUrl || null,
      await normalizeVersionChoice(asString(body.version), c),
      note,
      email,
      displayName || null,
      await sha256Hex(confirmToken),
      await sha256Hex(accessToken),
      now,
      now,
    )
    .run();

  const origin = requestOrigin(c.env, c.req.url);
  const statusUrl = `${origin}/submit/status?token=${encodeURIComponent(accessToken)}`;

  // 邮件发送放到响应之后，投稿接口无需等待外部服务
  defer(
    c,
    sendMail(
      c.env,
      submissionConfirmMail({
        to: email,
        title,
        confirmUrl: `${origin}/submit/confirm?token=${encodeURIComponent(confirmToken)}`,
        statusUrl,
        expiresAt: new Date(Date.parse(now) + SUBMISSION_TOKEN_TTL_MS).toISOString(),
      }),
    ),
  );

  return c.json(
    {
      ok: true,
      id,
      status_url: `/submit/status?token=${encodeURIComponent(accessToken)}`,
    },
    201,
  );
});

submissionRoutes.get('/submit/confirm', async (c) => {
  const token = (c.req.query('token') ?? '').trim();
  if (!token) return fail(c, 400, 'invalid_token', '确认链接不完整');

  const row = await c.env.DB.prepare(
    `SELECT id, kind, title, status, reject_reason, confirmed_at, created_at, updated_at
     FROM submissions WHERE confirm_token_hash = ?`,
  )
    .bind(await sha256Hex(token))
    .first<SubmissionTokenRow>();

  if (!row) return fail(c, 404, 'confirm_invalid', '确认链接无效，请检查邮件里的地址');
  if (Date.parse(row.created_at) + SUBMISSION_TOKEN_TTL_MS <= Date.now()) {
    return fail(c, 410, 'confirm_expired', '确认链接已过期，请重新提交');
  }
  if (row.status === 'spam') return fail(c, 410, 'confirm_invalid', '该投稿已失效');
  if (row.status !== 'new') return c.json({ ok: true, already: true, status: row.status });

  const now = nowIso();
  await c.env.DB.prepare(
    `UPDATE submissions SET status = 'confirmed', confirmed_at = ?, updated_at = ?
     WHERE id = ? AND status = 'new'`,
  )
    .bind(now, now, row.id)
    .run();

  return c.json({ ok: true, already: false, status: 'confirmed' });
});

submissionRoutes.get('/submit/status', async (c) => {
  const token = (c.req.query('token') ?? '').trim();
  if (!token) return fail(c, 400, 'invalid_token', '查询链接不完整');

  const row = await c.env.DB.prepare(
    `SELECT id, kind, title, status, reject_reason, confirmed_at, created_at, updated_at
     FROM submissions WHERE access_token_hash = ?`,
  )
    .bind(await sha256Hex(token))
    .first<SubmissionTokenRow>();

  if (!row) return fail(c, 404, 'status_invalid', '查询链接无效，请检查邮件里的地址');
  if (Date.parse(row.created_at) + SUBMISSION_TOKEN_TTL_MS <= Date.now()) {
    return fail(c, 410, 'status_expired', '查询链接已过期');
  }

  return c.json({ submission: row });
});
