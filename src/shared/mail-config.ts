/** SMTP 发信配置：管理台与 Worker 共用字段定义，密码只保存在服务端 */

export type SmtpSecurity = 'tls' | 'starttls' | 'none';

export interface SmtpConfig {
  enabled: boolean;
  host: string;
  port: number;
  security: SmtpSecurity;
  username: string;
  from: string;
  fromName: string;
}

/** 返回给管理台的视图，密码以 password_set 标记是否已保存 */
export interface SmtpConfigView extends SmtpConfig {
  password_set: boolean;
}

export const SMTP_DEFAULTS: SmtpConfig = {
  enabled: false,
  host: '',
  port: 465,
  security: 'tls',
  username: '',
  from: '',
  fromName: 'xwubi 管理台',
};
