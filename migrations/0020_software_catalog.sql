-- 软件库真实条目：五笔输入法、码表词库与辅助工具（30 条，含下载与使用说明）

INSERT INTO content (id, type, slug, version, title, summary, body_md, meta_json, status, published_at) VALUES
(
  'cnt_sw_01',
  'software',
  'software-jidian-windows',
  '86',
  '极点五笔（Windows）',
  '老牌免费五笔输入法，86 版为主，可加载 98 词库，功能设置项较全。',
  '## 适用版本

86 版为主，软件内可切换 98 版码表，切换后需重新导入对应词库。

## 平台

Windows 7/8/10/11（32 位与 64 位）。

## 使用说明

1. 从金山极点五笔下载中心获取安装包，安装时取消毒霸推荐勾选。
2. 安装完成后按 Ctrl+Shift 切换到极点五笔。
3. 右键状态栏，进入「输入法设置 → 词库」，导入 86 或 98 版词库后点「应用」。
4. 在「功能设置」中关闭「自动造词」，避免练习时词频被污染。
5. 用一段 200 字短文试打，确认编码、标点与候选数符合预期。

## 注意事项

官网已停更，当前由金山毒霸安全分发安装包；不要与其他五笔同时启用同一份码表。

## 下载

[极点五笔下载中心](https://www.ijinshan.com/softdownload/jidianwubi/download.html)',
  '{"source_url":"https://www.ijinshan.com/softdownload/jidianwubi/download.html","official_url":"https://www.ijinshan.com/softdownload/jidianwubi/index.html","platforms":["Windows"],"license":"free","version_support":["86","98"],"checked_at":"2026-11-17"}',
  'published',
  '2026-11-01'
),
(
  'cnt_sw_02',
  'software',
  'software-jidian-linux',
  '86',
  '极点五笔 Linux 版（Fcitx/IBus 插件）',
  'openKylin 社区维护的极点输入法，可编译为 Fcitx4、Fcitx5 与 IBus 插件。',
  '## 适用版本

86 版（极点默认码表）。

## 平台

Linux 桌面，支持 Fcitx4、Fcitx5 与 IBus。

## 使用说明

1. 在终端克隆仓库：git clone https://gitee.com/openkylin/freewb.git
2. 按 README 安装 cmake、fcitx5-dev 等编译依赖。
3. 执行 cmake -B build 与 make，成功后 sudo make install。
4. 重启 Fcitx5，在「配置 → 输入法」中添加「极点五笔」。
5. 试打常用字，确认码表与词库加载正常。

## 注意事项

插件必须与桌面实际使用的输入法框架一致；升级 Fcitx5 后通常需要重新编译。

## 下载

[openKylin/freewb](https://gitee.com/openkylin/freewb)',
  '{"source_url":"https://gitee.com/openkylin/freewb","official_url":"https://gitee.com/openkylin/freewb","platforms":["Linux"],"license":"opensource","version_support":["86"],"checked_at":"2026-11-17"}',
  'published',
  '2026-11-02'
),
(
  'cnt_sw_03',
  'software',
  'software-weasel',
  'all',
  '小狼毫 Weasel（Rime for Windows）',
  'Rime 引擎的 Windows 前端，可挂接 86、98 与新世纪五笔方案。',
  '## 适用版本

Rime 引擎本身不限版本，可加载 86、98、新世纪五笔方案。

## 平台

Windows 8.1/10/11。

## 使用说明

1. 从 GitHub Releases 下载 weasel 安装包并完成安装。
2. 右键任务栏小狼毫图标，选择「用户文件夹」。
3. 将五笔方案的 .schema.yaml 与 .dict.yaml 放入用户文件夹。
4. 右键图标选择「重新部署」，再按 F4 选择五笔方案。
5. 在方案文件中把词典指向 86 或 98 对应文件，保存后再次部署。

## 注意事项

不要直接修改程序目录内的 default.yaml；升级前备份整个用户文件夹。

## 下载

[rime/weasel](https://github.com/rime/weasel)',
  '{"source_url":"https://github.com/rime/weasel","official_url":"https://rime.im/download/","platforms":["Windows"],"license":"opensource","version_support":["86","98","xsj"],"checked_at":"2026-11-17"}',
  'published',
  '2026-11-03'
),
(
  'cnt_sw_04',
  'software',
  'software-squirrel',
  'all',
  '鼠须管 Squirrel（Rime for macOS）',
  'Rime 引擎的 macOS 前端，配置目录固定，适合挂接各类五笔方案。',
  '## 适用版本

Rime 引擎，支持 86、98 与新世纪五笔方案。

## 平台

macOS 13 及以上。

## 使用说明

1. 下载 .pkg 安装包并安装，按提示在「键盘 → 输入法」中添加鼠须管。
2. 在菜单栏选择「鼠须管 → 用户设定」，打开 ~/Library/Rime。
3. 把五笔方案的 yaml 文件复制到该目录。
4. 点击「重新部署」，用 Ctrl+反引号切换到五笔方案。
5. 在方案中调整候选数与简码提示，保存后再次部署。

## 注意事项

首次部署会编译词典，需等待进度结束；不要让两个 Rime 前端同时写同一目录。

## 下载

[rime/squirrel](https://github.com/rime/squirrel)',
  '{"source_url":"https://github.com/rime/squirrel","official_url":"https://rime.im/download/","platforms":["macOS"],"license":"opensource","version_support":["86","98","xsj"],"checked_at":"2026-11-17"}',
  'published',
  '2026-11-04'
),
(
  'cnt_sw_05',
  'software',
  'software-trime',
  'all',
  '同文输入法 Trime（Android）',
  'Android 上的 Rime 前端，可导入五笔方案与词典，支持 86/98/新世纪。',
  '## 适用版本

Rime 引擎，支持 86、98 与新世纪五笔方案。

## 平台

Android 8.0 及以上。

## 使用说明

1. 从 GitHub Releases 或 F-Droid 安装 Trime。
2. 在系统设置中启用同文输入法，并设为默认键盘。
3. 打开同文设置，进入「方案」导入五笔 schema 与词典。
4. 选择 86 或 98 方案，等待部署完成。
5. 在键盘上呼出方案菜单，确认码表已生效。

## 注意事项

Android 11 以上需授予文件访问权限才能读取 rime 目录；导入后不要反复覆盖词典。

## 下载

[osfans/trime](https://github.com/osfans/trime)',
  '{"source_url":"https://github.com/osfans/trime","official_url":"https://github.com/osfans/trime","platforms":["Android"],"license":"opensource","version_support":["86","98","xsj"],"checked_at":"2026-11-17"}',
  'published',
  '2026-11-05'
),
(
  'cnt_sw_06',
  'software',
  'software-fcitx5-chinese-addons',
  '86',
  'Fcitx5 中文附加组件（fcitx5-chinese-addons）',
  '为 Fcitx5 提供拼音与码表输入法引擎，内置五笔（86）与五笔拼音混输。',
  '## 适用版本

86 版五笔（内置 Wubi 与 Wubi-Pinyin 码表）。

## 平台

Linux 桌面（Fcitx5）。

## 使用说明

1. 用发行版包管理器安装 fcitx5 与 fcitx5-chinese-addons。
2. 重启 Fcitx5，打开「配置 → 输入法」。
3. 搜索 wubi，添加「五笔」或「五笔拼音」。
4. 在「附加组件 → 码表」中查看并调整当前码表。
5. 用 Ctrl+空格切换后试打，必要时调整候选页大小。

## 注意事项

码表引擎随 fcitx5-chinese-addons 提供，无需再装 fcitx5-table-extra；升级 Fcitx5 后建议重新登录会话。

## 下载

[fcitx/fcitx5-chinese-addons](https://github.com/fcitx/fcitx5-chinese-addons)',
  '{"source_url":"https://github.com/fcitx/fcitx5-chinese-addons","official_url":"https://fcitx-im.org/","platforms":["Linux"],"license":"opensource","version_support":["86"],"checked_at":"2026-11-17"}',
  'published',
  '2026-11-06'
),
(
  'cnt_sw_07',
  'software',
  'software-ibus-table',
  '86',
  'IBus Table 五笔（ibus-table-chinese）',
  'IBus 框架下的码表输入法，包含海峰五笔 86 等中文码表。',
  '## 适用版本

86 版（海峰 Wubi-Heifeng86）。

## 平台

Linux（GNOME 等使用 IBus 的桌面）。

## 使用说明

1. 安装 ibus-table 与 ibus-table-chinese。
2. 在终端执行 ibus restart。
3. 打开「区域与语言 → 输入源」，添加「汉语（五笔）」。
4. 在 ibus-setup 中选择「海峰五笔86」。
5. 试打并按需在首选项里开启简码提示。

## 注意事项

ibus-table 只负责码表引擎，码表由 ibus-table-chinese 提供，两者版本要匹配。

## 下载

[mike-fabian/ibus-table-chinese](https://github.com/mike-fabian/ibus-table-chinese)',
  '{"source_url":"https://github.com/mike-fabian/ibus-table-chinese","official_url":"https://github.com/mike-fabian/ibus-table-chinese","platforms":["Linux"],"license":"opensource","version_support":["86"],"checked_at":"2026-11-17"}',
  'published',
  '2026-11-07'
),
(
  'cnt_sw_08',
  'software',
  'software-microsoft-wubi',
  '86',
  '微软五笔',
  'Windows 10/11 内置五笔输入法，无需安装，可用 WubiLex 扩充词库。',
  '## 适用版本

86 版，随系统内置。

## 平台

Windows 10/11。

## 使用说明

1. 打开「设置 → 时间和语言 → 语言和区域」。
2. 在中文（简体）语言中点击「添加键盘」，选择「微软五笔」。
3. 用 Win+空格切换到微软五笔。
4. 右键任务栏输入法图标进入「设置」，关闭不需要的云候选。
5. 需要扩充词库时，用 WubiLex 导入 86 词库后重启输入法。

## 注意事项

微软五笔使用系统码表，不能直接挂 98 方案；调整前先备份自定义短语。

## 下载

[微软官方说明](https://support.microsoft.com/zh-cn/windows/hardware/input-devices/microsoft-simplified-chinese-ime)',
  '{"source_url":"https://support.microsoft.com/zh-cn/windows/hardware/input-devices/microsoft-simplified-chinese-ime","official_url":"https://support.microsoft.com/zh-cn/windows/hardware/input-devices/microsoft-simplified-chinese-ime","platforms":["Windows"],"license":"free","version_support":["86"],"checked_at":"2026-11-17"}',
  'published',
  '2026-11-08'
),
(
  'cnt_sw_09',
  'software',
  'software-sogou-wubi',
  '86',
  '搜狗五笔',
  '86/98 版五笔输入法，支持账号同步词库、皮肤与纯五笔模式。',
  '## 适用版本

86、98 与新世纪版（5.3 起新增 98 与新版五笔方案）。

## 平台

Windows XP/7/8/10。

## 使用说明

1. 打开官网点击「立即下载」，安装时取消捆绑组件。
2. 安装后在输入法列表选择搜狗五笔。
3. 右键状态栏进入「属性设置 → 词库」，导入自己的 86 词库。
4. 在「高级」中关闭自动更新词库，避免词频被云端覆盖。
5. 需要纯五笔时，把输入模式改为「纯五笔」。

## 注意事项

登录账号后会同步词库，公用电脑建议退出账号；皮肤与词库应分开备份。

## 下载

[搜狗五笔官网](https://wubi.sogou.com/)',
  '{"source_url":"https://wubi.sogou.com/","official_url":"https://wubi.sogou.com/","platforms":["Windows"],"license":"free","version_support":["86","98","xsj"],"checked_at":"2026-11-17"}',
  'published',
  '2026-11-09'
),
(
  'cnt_sw_10',
  'software',
  'software-qq-wubi',
  '86',
  'QQ五笔',
  '腾讯出品的 Windows 五笔输入法，安装简单，支持自定义词库与按键。',
  '## 适用版本

86 版。

## 平台

Windows XP/7/8/10/11。

## 使用说明

1. 打开腾讯软件中心 QQ五笔页面，点击「立即下载」获取 2.4.629.400 安装包。
2. 按向导安装，安装目录不要包含中文路径。
3. 安装完成后在输入法列表启用 QQ 五笔。
4. 右键状态栏进入「属性设置」，导入 86 词库并关闭自动造词。
5. 在「按键」中确认中英文切换键，避免与其他输入法冲突。

## 注意事项

原 wubi.qq.com 域名已无法解析，腾讯软件中心仍提供 2021 年的安装包；版本较旧，介意者可改用搜狗五笔。

## 下载

[腾讯软件中心 QQ五笔](https://pc.qq.com/detail/7/detail_207.html)',
  '{"source_url":"https://pc.qq.com/detail/7/detail_207.html","official_url":"https://pc.qq.com/detail/7/detail_207.html","platforms":["Windows"],"license":"free","version_support":["86"],"checked_at":"2026-11-17"}',
  'published',
  '2026-11-10'
),
(
  'cnt_sw_11',
  'software',
  'software-wanneng-wubi',
  '86',
  '万能五笔',
  '86 版五笔与拼音混合输入工具，支持导入自造词与行业词库。',
  '## 适用版本

86 版，支持五笔与拼音混合输入。

## 平台

Windows 7/8/10/11。

## 使用说明

1. 从官网下载 setup_WanNengWBInput.exe。
2. 安装前先卸载旧版，避免注册表残留。
3. 安装完成后在设置中导入原有自造词。
4. 把输入模式切换为「五笔优先」，关闭不需要的资讯弹窗。
5. 在「词库」里下载行业词库并按需启用。

## 注意事项

安装包会推荐其他万能产品，安装时逐项取消；升级前先导出词库。

## 下载

[万能五笔官网](http://www.wnwb.com/)',
  '{"source_url":"http://www.wnwb.com/","official_url":"http://www.wnwb.com/","platforms":["Windows"],"license":"free","version_support":["86"],"checked_at":"2026-11-17"}',
  'published',
  '2026-11-11'
),
(
  'cnt_sw_12',
  'software',
  'software-bingling',
  '86',
  '冰凌输入法',
  '以 86 版五笔为基础，同时支持 98 版和新世纪码表，可挂接第三方词库。',
  '## 适用版本

86、98 版，并可挂接新世纪等字母码表。

## 平台

Windows 7/10/11（32 位与 64 位）。

## 使用说明

1. 打开官网下载页，按码表选择 86 版或 98 版安装包。
2. 安装后在输入法列表启用冰凌输入法。
3. 右键状态栏进入「系统词库」，导入极爽或微软经典词库。
4. 在「方案」中切换 86/98/新世纪，确认码表与词库匹配。
5. 关闭不用的联想与自动造词，保存配置备份。

## 注意事项

86 与 98 词库不能混用；官网明确提示安装包超过 4MB 或版权信息不全时不要安装。

## 下载

[冰凌输入法官网](https://www.icesofts.com/)',
  '{"source_url":"https://www.icesofts.com/","official_url":"https://www.icesofts.com/","platforms":["Windows"],"license":"free","version_support":["86","98","xsj"],"checked_at":"2026-11-17"}',
  'published',
  '2026-11-12'
),
(
  'cnt_sw_13',
  'software',
  'software-jipin-wubi',
  '86',
  '极品五笔',
  '原生 86 版五笔输入法，词库约五万条，支持 Ctrl+M 输入 GBK 生僻字。',
  '## 适用版本

86 版。

## 平台

Windows 7/10（32 位与 64 位）。

## 使用说明

1. 打开发布主页的「软件下载」页获取安装包。
2. 安装时留意取消下载站的附加勾选。
3. 启用后用 Ctrl+M 切换到 GBK 字符集输入生僻字。
4. 在设置中关闭词语联想与光标跟随，减少干扰。
5. 用 Ctrl+序号 手动调整重码顺序。

## 注意事项

网站为个人发布页，下载后核对安装包大小与版权信息；暂不支持 Win8 Metro 界面。

## 下载

[极品五笔发布主页](http://www.jpwb.cc/)',
  '{"source_url":"http://www.jpwb.cc/","official_url":"http://www.jpwb.cc/","platforms":["Windows"],"license":"free","version_support":["86"],"checked_at":"2026-11-17"}',
  'published',
  '2026-11-13'
),
(
  'cnt_sw_14',
  'software',
  'software-loginput-macos',
  'all',
  '落格输入法 macOS 3',
  'macOS 商业输入法，可自定五笔 86/98 码表，支持大量按键与候选设置。',
  '## 适用版本

可自定五笔 86/98 码表。

## 平台

macOS 13 及以上。

## 使用说明

1. 从官网下载 dmg，拖入「应用程序」并完成安装。
2. 在「系统设置 → 键盘 → 输入法」中添加落格输入法。
3. 打开落格设置，在「方案」中导入五笔码表与词库。
4. 选择 86 或 98 方案，设置候选数与简码提示。
5. 用 Caps Lock 或自定义热键切换中英文。

## 注意事项

商业软件需购买授权；导入码表前先导出默认方案备份。

## 下载

[落格输入法 macOS 3](https://im.logcg.com/loginputmac3)',
  '{"source_url":"https://im.logcg.com/loginputmac3","official_url":"https://im.logcg.com/loginputmac3","platforms":["macOS"],"license":"commercial","version_support":["86","98"],"checked_at":"2026-11-17"}',
  'published',
  '2026-11-14'
),
(
  'cnt_sw_15',
  'software',
  'software-yong',
  'all',
  '小小输入法（yong）',
  '轻量码表型输入法平台，可挂接 86/98 五笔码表，覆盖 Windows、Linux 与 Android。',
  '## 适用版本

可挂接 86、98 及自定义码表。

## 平台

Windows、Linux、Android（外接键盘）。

## 使用说明

1. 从官网论坛下载对应平台安装包。
2. Linux 下执行 yong-tool.sh --select 完成注册，Windows 直接运行主程序。
3. 在配置目录放入五笔码表，编辑 yong.ini 指定方案。
4. 重启输入法，用快捷键切换方案。
5. 在设置中关闭不需要的云功能，保留本地词库。

## 注意事项

配置以文本文件为主，改错会导致无法启动，修改前先备份 yong.ini。

## 下载

[小小输入法官网](https://yong.dgod.net/)',
  '{"source_url":"https://yong.dgod.net/","official_url":"https://yong.dgod.net/","platforms":["Windows","Linux","Android"],"license":"free","version_support":["86","98"],"checked_at":"2026-11-17"}',
  'published',
  '2026-11-15'
),
(
  'cnt_sw_16',
  'software',
  'software-xiaoya-wubi',
  '86',
  '小鸭五笔',
  '以五笔为主、拼音辅助的 Windows 输入法，突出显示简码字，适合初学。',
  '## 适用版本

86 版，另可加载 98 版词库。

## 平台

Windows XP/7/8/10/11。

## 使用说明

1. 从腾讯软件中心获取 3.3.0.0 安装包（原官方域名已停用）。
2. 安装后在输入法列表启用小鸭五笔。
3. 右键状态栏进入「词库管理」，导入 86 或 98 词库。
4. 开启「简码字突出显示」，方便初学阶段识别简码。
5. 在「反查」中开启拼音反查，遇到生字可即时查编码。

## 注意事项

软件多年未更新，Win11 下如遇兼容问题可尝试兼容模式运行。

## 下载

[腾讯软件中心页面](https://pc.qq.com/detail/1/detail_221.html)',
  '{"source_url":"https://pc.qq.com/detail/1/detail_221.html","platforms":["Windows"],"license":"free","version_support":["86","98"],"checked_at":"2026-11-17"}',
  'published',
  '2026-11-16'
),
(
  'cnt_sw_17',
  'software',
  'software-fcitx5-android',
  'all',
  '小企鹅输入法5（Fcitx5 for Android）',
  'Android 上的 Fcitx5 前端，可通过码表插件导入 86/98 五笔。',
  '## 适用版本

通过码表插件支持 86 与 98 五笔。

## 平台

Android 8.0 及以上。

## 使用说明

1. 从 GitHub Releases 或 F-Droid 安装小企鹅输入法5。
2. 在系统设置中启用并设为默认输入法。
3. 在应用内「输入法」中添加「表格式输入法」插件。
4. 导入 wubi 码表（文本码表或 libime 词典）。
5. 选择五笔方案后试打，按需调整键盘布局。

## 注意事项

部分应用商店版本不能与 GitHub 版覆盖安装；导入码表需授予文件权限。

## 下载

[fcitx5-android 官网](https://fcitx5-android.github.io/)',
  '{"source_url":"https://fcitx5-android.github.io/","official_url":"https://fcitx5-android.github.io/","platforms":["Android"],"license":"opensource","version_support":["86","98"],"checked_at":"2026-11-17"}',
  'published',
  '2026-11-17'
),
(
  'cnt_sw_18',
  'software',
  'software-rime-wubi',
  'all',
  'Rime 五笔方案（rime-wubi）',
  '面向 Rime 引擎的五笔方案合集，覆盖 86、98 与新世纪，可部署到多个前端。',
  '## 适用版本

86、98 与新世纪。

## 平台

Windows（小狼毫）、macOS（鼠须管）、Linux、Android（同文）。

## 使用说明

1. 打开仓库，下载 Release 中的方案压缩包。
2. 解压后把 wubi86、wubi98 或 xsj 的 yaml 文件放入 Rime 用户目录。
3. 重新部署，按 F4 选择对应五笔方案。
4. 在方案文件中设置简码提示与候选数量。
5. 词库有更新时替换 .dict.yaml 后再次部署。

## 注意事项

不要混放不同版本的词典文件；部署失败时查看日志中的 yaml 语法错误。

## 下载

[mrshiqiqi/rime-wubi](https://github.com/mrshiqiqi/rime-wubi)',
  '{"source_url":"https://github.com/mrshiqiqi/rime-wubi","official_url":"https://github.com/mrshiqiqi/rime-wubi","platforms":["Windows","macOS","Linux","Android"],"license":"opensource","version_support":["86","98","xsj"],"checked_at":"2026-11-17"}',
  'published',
  '2026-11-01'
),
(
  'cnt_sw_19',
  'software',
  'software-rime-wubi86-jidian',
  '86',
  '极点 86 五笔 Rime 方案',
  '把极点五笔 86 码表移植到 Rime，适配小狼毫、鼠须管、同文等前端。',
  '## 适用版本

86 版极点码表。

## 平台

Windows、macOS、Linux、iOS、Android。

## 使用说明

1. 下载仓库中的方案与词典文件。
2. 复制到对应 Rime 前端用户目录（如 ~/Library/Rime）。
3. 在 default.custom.yaml 中启用 wubi86_jidian。
4. 重新部署后按 F4 切换方案。
5. 按需调整候选数与标点映射。

## 注意事项

方案基于 86 版，不要与 98 词典混用；升级前备份用户词库。

## 下载

[KyleBing/rime-wubi86-jidian](https://github.com/KyleBing/rime-wubi86-jidian)',
  '{"source_url":"https://github.com/KyleBing/rime-wubi86-jidian","official_url":"https://github.com/KyleBing/rime-wubi86-jidian","platforms":["Windows","macOS","Linux","iOS","Android"],"license":"opensource","version_support":["86"],"checked_at":"2026-11-17"}',
  'published',
  '2026-11-02'
),
(
  'cnt_sw_20',
  'software',
  'software-rime-wubi98',
  '98',
  'Rime 五笔 98 方案',
  '独立的 98 版五笔 Rime 方案，含 schema 与 dict，配置步骤清晰。',
  '## 适用版本

98 版。

## 平台

Windows、macOS、Linux（Rime 前端）。

## 使用说明

1. 下载仓库 zip 或克隆到本地。
2. 把 wubi98.schema.yaml 与 wubi98.dict.yaml 放入 Rime 用户目录。
3. 在 default.custom.yaml 的 schema_list 中加入 wubi98。
4. 重新部署，切换到五笔 98 方案。
5. 试打常用字，确认字根与 98 编码一致。

## 注意事项

98 版字根与 86 差异较大，不要直接套用 86 的用户词库。

## 下载

[arzyu/rime-wubi98](https://github.com/arzyu/rime-wubi98)',
  '{"source_url":"https://github.com/arzyu/rime-wubi98","official_url":"https://github.com/arzyu/rime-wubi98","platforms":["Windows","macOS","Linux"],"license":"opensource","version_support":["98"],"checked_at":"2026-11-17"}',
  'published',
  '2026-11-03'
),
(
  'cnt_sw_21',
  'software',
  'software-98wubi-tables',
  '98',
  '98 五笔基础码表与超大字符集',
  '98 五笔码表整理项目，提供基础码表与超大字符集版本，可转换到多种输入法。',
  '## 适用版本

98 版基础码表与超大字符集。

## 平台

Windows、macOS、Linux、Android。

## 使用说明

1. 打开仓库，按需下载基础码表或 unicode 码表。
2. 把码表转换为所用输入法格式（Rime、fcitx5 或多多）。
3. 导入后切换 98 方案并重新部署。
4. 用生僻字测试超大字符集是否生效。
5. 保留一份原始码表，便于以后增量合并。

## 注意事项

码表文件较大，导入超大字符集会明显增加部署时间。

## 下载

[yanhuacuo/98wubi-tables](https://github.com/yanhuacuo/98wubi-tables)',
  '{"source_url":"https://github.com/yanhuacuo/98wubi-tables","official_url":"https://github.com/yanhuacuo/98wubi-tables","platforms":["Windows","macOS","Linux","Android"],"license":"opensource","version_support":["98"],"checked_at":"2026-11-17"}',
  'published',
  '2026-11-04'
),
(
  'cnt_sw_22',
  'software',
  'software-wubilex',
  'all',
  'WubiLex 五笔助手',
  '增强微软五笔的词库管理与码表切换工具，内置 86/98/新世纪等码表。',
  '## 适用版本

86、98、091、092 与新世纪。

## 平台

Windows 10/11。

## 使用说明

1. 从官网下载 WubiLex.7z，解压后直接运行。
2. 在「码表」页选择目标版本，先备份当前微软五笔词库。
3. 点击「安装码表」，等待写入系统词库。
4. 用「智能造词」补充流行词，再点「应用」。
5. 按 Ctrl+F2 打开反查窗，验证编码与拆字。

## 注意事项

操作会改写系统微软五笔词库，建议先备份 ChsWubi.lex；每次只切换一个码表版本。

## 下载

[WubiLex 五笔助手](https://wubi.aardio.com/)',
  '{"source_url":"https://wubi.aardio.com/","official_url":"https://wubi.aardio.com/","platforms":["Windows"],"license":"opensource","version_support":["86","98","xsj"],"checked_at":"2026-11-17"}',
  'published',
  '2026-11-05'
),
(
  'cnt_sw_23',
  'software',
  'software-jinshan-typing',
  'all',
  '金山打字通',
  '老牌打字练习软件，内置 86/98 五笔字根与文章课程，可记录练习成绩。',
  '## 适用版本

86、98 五笔课程。

## 平台

Windows 7/8/10/11。

## 使用说明

1. 从官网下载并安装金山打字通。
2. 打开「五笔打字」，先完成字根与一级简码课程。
3. 在设置中选择 86 或 98 版字根表。
4. 每天用「文章练习」打 10 分钟，记录速度与正确率。
5. 错字会进入弱项列表，次日优先重练。

## 注意事项

课程按 86 版设计，练 98 版时需手动切换字根表；安装时取消捆绑软件。

## 下载

[金山打字通官网](https://dazi.ijinshan.com/)',
  '{"source_url":"https://dazi.ijinshan.com/","official_url":"https://dazi.ijinshan.com/","platforms":["Windows"],"license":"free","version_support":["86","98"],"checked_at":"2026-11-17"}',
  'published',
  '2026-11-06'
),
(
  'cnt_sw_24',
  'software',
  'software-jinshan-typing-online',
  'all',
  '金山打字通在线练习',
  '浏览器里直接练中文打字，实时显示速度与正确率，适合课前热身。',
  '## 适用版本

86/98 通用练习。

## 平台

浏览器（Chrome、Edge、Firefox）。

## 使用说明

1. 打开在线练习页，点击「开始练习」。
2. 在输入框内按提示输入中文，页面实时统计速度与正确率。
3. 练习前先切换到系统里的五笔输入法。
4. 每轮 3-5 分钟，完成后记录成绩。
5. 需要字根课程时再下载桌面版。

## 注意事项

网页版不保存成绩，刷新即丢失；不适合做长篇文章训练。

## 下载

[金山打字通在线练习](https://dazi.ijinshan.com/pages/online/index.html)',
  '{"source_url":"https://dazi.ijinshan.com/pages/online/index.html","official_url":"https://dazi.ijinshan.com/","platforms":["Web"],"license":"free","version_support":["86","98"],"checked_at":"2026-11-17"}',
  'published',
  '2026-11-07'
),
(
  'cnt_sw_25',
  'software',
  'software-jipin-typing-online',
  '86',
  '极品五笔在线练习',
  '极品五笔官方发布页提供的简码与全码在线练习，直接检验 86 编码。',
  '## 适用版本

86 版简码与全码练习。

## 平台

浏览器。

## 使用说明

1. 打开极品五笔在线练习页。
2. 选择一级简码、二级简码或全码模式。
3. 把光标定位到输入框，按编码后补空格上屏。
4. 连续练习 10 分钟，记录错误编码。
5. 再到字根表页核对对应字根。

## 注意事项

页面需允许脚本运行；使用浏览器翻译插件可能导致输入法被拦截。

## 下载

[极品五笔在线练习](http://www.jpwb.cc/zxlx.htm)',
  '{"source_url":"http://www.jpwb.cc/zxlx.htm","official_url":"http://www.jpwb.cc/","platforms":["Web"],"license":"free","version_support":["86"],"checked_at":"2026-11-17"}',
  'published',
  '2026-11-08'
),
(
  'cnt_sw_26',
  'software',
  'software-qimeng-wubi',
  '86',
  '启蒙五笔',
  '面向零基础的五笔学习平台，提供字根、拆字、编码反查与文章练习。',
  '## 适用版本

86 版。

## 平台

Web、Windows、Android。

## 使用说明

1. 打开官网选择在线练习或下载客户端。
2. 先做字根练习，按分区逐个熟悉键位。
3. 进入拆字练习，看图示理解取码顺序。
4. 用编码反查核对不确定的字。
5. 每天做一组文章练习，记录速度。

## 注意事项

在线版需保持网络；客户端离线可用，适合长期练习。

## 下载

[启蒙五笔](https://wubixuexi.com/)',
  '{"source_url":"https://wubixuexi.com/","official_url":"https://wubixuexi.com/","platforms":["Web","Windows","Android"],"license":"free","version_support":["86"],"checked_at":"2026-11-17"}',
  'published',
  '2026-11-09'
),
(
  'cnt_sw_27',
  'software',
  'software-qiaoshou-typing',
  '86',
  '巧手打字通',
  '在线打字学习平台，含五笔口诀、看图拆字、词组与文章练习及成绩曲线。',
  '## 适用版本

86 版五笔练习。

## 平台

Web。

## 使用说明

1. 打开网站并注册账号（部分功能免登录）。
2. 选择「五笔打字」模块，先做五笔口诀与看图拆字训练。
3. 使用词组与文章练习，查看速度曲线。
4. 根据错字统计做专项重练。
5. 用「五笔拼音」工具核对不确定的编码。

## 注意事项

免费账号有部分功能限制；练习数据保存在账号内，换设备需重新登录。

## 下载

[巧手打字通](https://www.laidazi.com/)',
  '{"source_url":"https://www.laidazi.com/","official_url":"https://www.laidazi.com/","platforms":["Web"],"license":"free","version_support":["86"],"checked_at":"2026-11-17"}',
  'published',
  '2026-11-10'
),
(
  'cnt_sw_28',
  'software',
  'software-xuelai-wubi',
  'all',
  '学来五笔编码查询',
  '在线查汉字五笔编码与拆字图解，适合练习时快速核对。',
  '## 适用版本

86 版编码查询，附带拆字图解。

## 平台

Web。

## 使用说明

1. 打开网站，在搜索框输入单个汉字。
2. 查看全码、简码与拆字图解。
3. 点击同音字或部首，扩展查询相关字。
4. 遇到多音字时核对拼音与编码对应关系。
5. 把易错字加入浏览器书签，定期复习。

## 注意事项

查询结果以 86 版为准，98 版用户需另行核对；不要用于批量抓取。

## 下载

[学来五笔](https://wubi.xuelai.com/)',
  '{"source_url":"https://wubi.xuelai.com/","official_url":"https://wubi.xuelai.com/","platforms":["Web"],"license":"free","version_support":["86"],"checked_at":"2026-11-17"}',
  'published',
  '2026-11-11'
),
(
  'cnt_sw_29',
  'software',
  'software-wawa-wubi-query',
  'all',
  '蛙蛙五笔编码查询',
  '支持 86/98 编码与简码查询的在线工具，附五笔字根表。',
  '## 适用版本

86 与 98 编码查询。

## 平台

Web。

## 使用说明

1. 打开五笔编码查询页。
2. 选择 86 编码、86 简码、98 编码或 98 简码。
3. 输入最多十个汉字，点击查询。
4. 对照字根表确认拆分。
5. 结果异常时反馈缺字。

## 注意事项

每分钟查询次数有限；数据库仍在完善，生僻字可能缺失。

## 下载

[蛙蛙五笔编码查询](https://www.iamwawa.cn/wubi.html)',
  '{"source_url":"https://www.iamwawa.cn/wubi.html","official_url":"https://www.iamwawa.cn/wubi.html","platforms":["Web"],"license":"free","version_support":["86","98"],"checked_at":"2026-11-17"}',
  'published',
  '2026-11-12'
),
(
  'cnt_sw_30',
  'software',
  'software-toolpro-wubi-query',
  '86',
  'ToolPro 五笔编码查询（86 版）',
  '内置 GB2312 全部 6763 字的 86 版码表，支持反查、正查与限时编码练习。',
  '## 适用版本

86 版。

## 平台

Web。

## 使用说明

1. 打开五笔编码查询工具页。
2. 在「汉字 → 编码」中输入文字反查编码。
3. 切换到「编码 → 汉字」可正查候选字。
4. 用简码练习模块做限时训练。
5. 对照 25 键字根图复习口诀。

## 注意事项

内置 GB2312 6763 字，超出范围的生僻字查不到；纯本地查询无需联网。

## 下载

[ToolPro 五笔编码查询](https://www.toolpro.cc/tool/wubi-query)',
  '{"source_url":"https://www.toolpro.cc/tool/wubi-query","official_url":"https://www.toolpro.cc/tool/wubi-query","platforms":["Web"],"license":"free","version_support":["86"],"checked_at":"2026-11-17"}',
  'published',
  '2026-11-13'
)
ON CONFLICT(type, slug, version) DO UPDATE SET
  title=excluded.title,
  summary=excluded.summary,
  body_md=excluded.body_md,
  meta_json=excluded.meta_json,
  status=excluded.status,
  updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now');

-- 标签：输入法与辅助工具归入「软件与工具」，词库/码表方案归入「码表与词库」，
-- 让软件库列表按标签分组时可筛选。
INSERT OR IGNORE INTO content_tags (content_id, tag_id) VALUES
  ('cnt_sw_01', 'tag-tool'),
  ('cnt_sw_02', 'tag-tool'),
  ('cnt_sw_03', 'tag-tool'),
  ('cnt_sw_04', 'tag-tool'),
  ('cnt_sw_05', 'tag-tool'),
  ('cnt_sw_06', 'tag-tool'),
  ('cnt_sw_07', 'tag-tool'),
  ('cnt_sw_08', 'tag-tool'),
  ('cnt_sw_09', 'tag-tool'),
  ('cnt_sw_10', 'tag-tool'),
  ('cnt_sw_11', 'tag-tool'),
  ('cnt_sw_12', 'tag-tool'),
  ('cnt_sw_13', 'tag-tool'),
  ('cnt_sw_14', 'tag-tool'),
  ('cnt_sw_15', 'tag-tool'),
  ('cnt_sw_16', 'tag-tool'),
  ('cnt_sw_17', 'tag-tool'),
  ('cnt_sw_18', 'tag-code'),
  ('cnt_sw_19', 'tag-code'),
  ('cnt_sw_20', 'tag-code'),
  ('cnt_sw_21', 'tag-code'),
  ('cnt_sw_22', 'tag-tool'),
  ('cnt_sw_23', 'tag-tool'),
  ('cnt_sw_24', 'tag-tool'),
  ('cnt_sw_25', 'tag-tool'),
  ('cnt_sw_26', 'tag-tool'),
  ('cnt_sw_27', 'tag-tool'),
  ('cnt_sw_28', 'tag-tool'),
  ('cnt_sw_29', 'tag-tool'),
  ('cnt_sw_30', 'tag-tool');

-- 内容与标签变化后自增 epoch，让 KV 里的公开接口缓存立即换键
UPDATE settings
SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT),
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE key = 'site_epoch';
