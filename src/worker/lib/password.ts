/** 密码规则校验，返回错误提示；通过时返回 null */
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return '密码至少需要 8 位';
  if (password.length > 128) return '密码不能超过 128 位';
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return '密码需同时包含字母和数字';
  return null;
}
