#!/usr/bin/env node
/**
 * 猫咪捕猎游戏 - 一键启动脚本 v2.0
 *
 * 功能：
 *   - 环境检查（Node.js / Python / 浏览器 / 磁盘空间）
 *   - 依赖项安装（npm install，含完整性验证）
 *   - 游戏文件完整性校验（结构 / 大小 / 内容引用）
 *   - 自动配置游戏运行参数（运行时参数注入）
 *   - 配置文件支持（start.config.json）
 *   - 静态服务启动（优先 Node，回退 Python）
 *   - 命令行参数自定义（端口、模式、日志级别等）
 *   - 文件日志记录（logs/ 目录）
 *   - 完善的错误处理与诊断提示
 *   - 跨平台兼容（Windows / macOS / Linux）
 *
 * 用法：
 *   node start.js [选项]
 *   node start.js --port 3000 --mode dev --log debug
 *   node start.js --help
 *
 * 配置文件：
 *   在项目根目录创建 start.config.json 可自定义默认参数，
 *   命令行参数优先级高于配置文件。
 */

'use strict';

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');
const crypto = require('crypto');

// ─── 常量定义 ────────────────────────────────────────────────

const SCRIPT_VERSION = '2.0.0';
const MIN_NODE_VERSION = 14;
const MIN_DISK_SPACE_MB = 50;
const LOG_DIR = 'logs';
const CONFIG_FILE = 'start.config.json';

const DEFAULT_CONFIG = {
  port: 8080,
  mode: 'dev',
  log: 'info',
  open: true,
  check: false,
  autoInstall: true,
  verifyIntegrity: true,
  injectConfig: true,
  logToFile: true,
};

// ─── 命令行参数解析 ───────────────────────────────────────────

function parseArgs(argv) {
  const args = { ...DEFAULT_CONFIG };
  for (let j = 2; j < argv.length; j++) {
    const arg = argv[j];
    switch (arg) {
      case '--port': case '-p':
        args.port = parseInt(argv[++j], 10);
        break;
      case '--mode': case '-m':
        args.mode = argv[++j];
        break;
      case '--log': case '-l':
        args.log = argv[++j];
        break;
      case '--no-open':
        args.open = false;
        break;
      case '--check': case '-c':
        args.check = true;
        break;
      case '--no-install':
        args.autoInstall = false;
        break;
      case '--no-verify':
        args.verifyIntegrity = false;
        break;
      case '--no-inject':
        args.injectConfig = false;
        break;
      case '--no-log-file':
        args.logToFile = false;
        break;
      case '--version': case '-v':
        console.log(`猫咪捕猎游戏启动脚本 v${SCRIPT_VERSION}`);
        process.exit(0);
      case '--help': case '-h':
        printHelp();
        process.exit(0);
      default:
        if (arg.startsWith('-')) {
          console.error(`未知参数: ${arg}`);
          printHelp();
          process.exit(1);
        }
    }
  }
  return args;
}

function loadConfigFile(args) {
  const configPath = path.join(__dirname, CONFIG_FILE);
  if (!fs.existsSync(configPath)) return args;

  try {
    const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    // 配置文件中的值作为默认值，命令行参数优先
    const merged = { ...DEFAULT_CONFIG, ...fileConfig, ...args };
    // 布尔参数：如果命令行显式设置了，则覆盖配置文件
    return merged;
  } catch (e) {
    console.warn(`[WARN] 配置文件 ${CONFIG_FILE} 解析失败: ${e.message}`);
    return args;
  }
}

function validateArgs(args) {
  const errors = [];

  if (isNaN(args.port) || args.port < 1 || args.port > 65535) {
    errors.push(`端口号无效: ${args.port} (有效范围: 1-65535)`);
  }

  const validModes = ['dev', 'prod', 'test'];
  if (!validModes.includes(args.mode)) {
    errors.push(`启动模式无效: ${args.mode} (有效值: ${validModes.join(', ')})`);
  }

  const validLogLevels = ['debug', 'info', 'warn', 'error'];
  if (!validLogLevels.includes(args.log)) {
    errors.push(`日志级别无效: ${args.log} (有效值: ${validLogLevels.join(', ')})`);
  }

  if (errors.length > 0) {
    for (const e of errors) console.error(`[ERROR] ${e}`);
    process.exit(1);
  }

  return args;
}

function printHelp() {
  console.log(`
猫咪捕猎游戏 - 一键启动脚本 v${SCRIPT_VERSION}

用法: node start.js [选项]

选项:
  -p, --port <端口号>      服务端口 (默认: 8080)
  -m, --mode <模式>        启动模式: dev | prod | test (默认: dev)
  -l, --log <级别>         日志级别: debug | info | warn | error (默认: info)
  --no-open                不自动打开浏览器
  --no-install             跳过依赖安装
  --no-verify              跳过文件完整性校验
  --no-inject              跳过运行参数注入
  --no-log-file            禁用文件日志记录
  -c, --check              仅运行环境检查，不启动服务
  -v, --version            显示版本号
  -h, --help               显示帮助信息

配置文件:
  在项目根目录创建 ${CONFIG_FILE} 可自定义默认参数。
  命令行参数优先级高于配置文件。

  示例 ${CONFIG_FILE}:
  {
    "port": 3000,
    "mode": "dev",
    "log": "info",
    "open": true,
    "autoInstall": true,
    "verifyIntegrity": true,
    "injectConfig": true,
    "logToFile": true
  }

示例:
  node start.js                        # 默认启动 (端口 8080)
  node start.js --port 3000            # 指定端口 3000
  node start.js --mode prod            # 生产模式启动
  node start.js --log debug            # 调试日志
  node start.js --check                # 仅检查环境
  node start.js --no-install           # 跳过依赖安装
  node start.js --no-verify            # 跳过完整性校验

环境要求:
  - Node.js >= ${MIN_NODE_VERSION} (必需)
  - Python 3 (可选，作为备选服务器)
  - npm (可选，用于依赖安装)

日志文件:
  日志输出到 ${LOG_DIR}/ 目录，按日期命名。
  开发模式下日志同时输出到控制台和文件。

故障排查:
  1. 运行 node start.js --check 检查环境
  2. 运行 node start.js --log debug 查看详细日志
  3. 检查 ${LOG_DIR}/ 目录下的日志文件
  4. 确保端口未被其他程序占用
`);
}

// ─── 日志工具 ─────────────────────────────────────────────────

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

function createLogger(level, logToFile) {
  const lv = LOG_LEVELS[level] ?? LOG_LEVELS.info;
  const prefix = { debug: '[DEBUG]', info: '[INFO ]', warn: '[WARN ]', error: '[ERROR]' };
  let fileStream = null;

  if (logToFile) {
    const logDir = path.join(__dirname, LOG_DIR);
    if (!fs.existsSync(logDir)) {
      try { fs.mkdirSync(logDir, { recursive: true }); } catch { /* 忽略 */ }
    }
    const dateStr = new Date().toISOString().slice(0, 10);
    const logFile = path.join(logDir, `start-${dateStr}.log`);
    try {
      fileStream = fs.createWriteStream(logFile, { flags: 'a' });
    } catch {
      console.warn(`[WARN] 无法创建日志文件: ${logFile}`);
    }
  }

  function write(levelName, messages) {
    const timestamp = new Date().toISOString().slice(11, 19);
    const line = `${timestamp} ${prefix[levelName]} ${messages.join(' ')}`;
    if (fileStream) fileStream.write(line + '\n');
    return line;
  }

  const logger = {
    debug: (...m) => { if (lv <= 0) { const l = write('debug', m); console.log(l); } },
    info: (...m) => { if (lv <= 1) { const l = write('info', m); console.log(l); } },
    warn: (...m) => { if (lv <= 2) { const l = write('warn', m); console.warn(l); } },
    error: (...m) => { if (lv <= 3) { const l = write('error', m); console.error(l); } },
    close: () => { if (fileStream) fileStream.end(); },
  };

  return logger;
}

// ─── 工具函数 ─────────────────────────────────────────────────

/** 检测命令是否可用 */
function commandExists(cmd) {
  try {
    const redirect = process.platform === 'win32' ? '>nul 2>&1' : '>/dev/null 2>&1';
    execSync(`${cmd} --version ${redirect}`, { stdio: 'pipe', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/** 获取命令版本号 */
function getVersion(cmd) {
  try {
    return execSync(`${cmd} --version`, { encoding: 'utf-8', timeout: 5000 }).trim();
  } catch {
    return null;
  }
}

/** 检查端口是否被占用 */
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => { server.close(); resolve(false); });
    server.listen(port);
  });
}

/** 获取可用端口 */
function findAvailablePort(startPort, maxAttempts = 10) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    function tryPort(port) {
      if (attempts >= maxAttempts) {
        reject(new Error(`在 ${startPort}-${startPort + maxAttempts} 范围内未找到可用端口`));
        return;
      }
      attempts++;
      const server = http.createServer();
      server.once('error', () => tryPort(port + 1));
      server.once('listening', () => { server.close(); resolve(port); });
      server.listen(port);
    }
    tryPort(startPort);
  });
}

/** 打开浏览器 */
function openBrowser(url) {
  const platform = process.platform;
  let cmd, args;
  if (platform === 'win32') {
    cmd = 'cmd';
    args = ['/c', 'start', '""', url];
  } else if (platform === 'darwin') {
    cmd = 'open';
    args = [url];
  } else {
    cmd = 'xdg-open';
    args = [url];
  }
  try {
    spawn(cmd, args, { stdio: 'ignore', detached: true }).unref();
  } catch {
    console.warn(`无法自动打开浏览器，请手动访问: ${url}`);
  }
}

/** 获取磁盘可用空间（MB） */
function getDiskSpaceMB(dirPath) {
  try {
    if (process.platform === 'win32') {
      const output = execSync(
        `powershell -NoProfile -Command "(Get-PSDrive -Name '${dirPath.charAt(0)}').Free / 1MB"`,
        { encoding: 'utf-8', timeout: 5000 }
      ).trim();
      return Math.round(parseFloat(output));
    }
    // macOS / Linux
    const output = execSync(`df -m "${dirPath}"`, { encoding: 'utf-8', timeout: 5000 });
    const lines = output.trim().split('\n');
    if (lines.length >= 2) {
      const parts = lines[1].split(/\s+/);
      return parseInt(parts[3], 10); // Available 列
    }
  } catch { /* 忽略 */ }
  return null;
}

/** 计算文件 SHA-256 */
function fileSha256(filePath) {
  try {
    const data = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(data).digest('hex');
  } catch {
    return null;
  }
}

/** 格式化字节大小 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── 环境检查 ─────────────────────────────────────────────────

function checkEnvironment(log) {
  const results = [];
  let hasBlocker = false;

  // Node.js 检查
  const nodeVer = getVersion('node');
  if (nodeVer) {
    const major = parseInt(nodeVer.replace(/^v/, '').split('.')[0], 10);
    if (major >= MIN_NODE_VERSION) {
      results.push({ name: 'Node.js', status: 'ok', detail: nodeVer });
    } else {
      results.push({ name: 'Node.js', status: 'error', detail: `${nodeVer} (需要 >= ${MIN_NODE_VERSION})` });
      hasBlocker = true;
    }
  } else {
    results.push({ name: 'Node.js', status: 'error', detail: '未安装' });
    hasBlocker = true;
  }

  // Python 检查（备选服务器）
  const pythonCmd = commandExists('python3') ? 'python3' : (commandExists('python') ? 'python' : null);
  if (pythonCmd) {
    const pyVer = getVersion(pythonCmd);
    results.push({ name: 'Python', status: 'ok', detail: `${pythonCmd} ${pyVer}` });
  } else {
    results.push({ name: 'Python', status: 'warn', detail: '未安装（备选服务器不可用）' });
  }

  // npm 检查
  const npmVer = getVersion('npm');
  if (npmVer) {
    results.push({ name: 'npm', status: 'ok', detail: npmVer });
  } else {
    results.push({ name: 'npm', status: 'warn', detail: '未安装（无法自动安装依赖）' });
  }

  // 操作系统信息
  results.push({
    name: '操作系统',
    status: 'ok',
    detail: `${os.type()} ${os.release()} (${os.arch()})`,
  });

  // 磁盘空间检查
  const diskMB = getDiskSpaceMB(__dirname);
  if (diskMB !== null) {
    if (diskMB < MIN_DISK_SPACE_MB) {
      results.push({ name: '磁盘空间', status: 'warn', detail: `${diskMB} MB 可用（建议 >= ${MIN_DISK_SPACE_MB} MB）` });
    } else {
      results.push({ name: '磁盘空间', status: 'ok', detail: `${diskMB} MB 可用` });
    }
  }

  // 打印结果
  console.log('\n── 环境检查 ──────────────────────');
  for (const r of results) {
    const icon = r.status === 'ok' ? 'OK' : r.status === 'warn' ? '!!' : 'XX';
    console.log(`  [${icon}] ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (hasBlocker) {
    log.error('环境检查未通过，请安装缺失的依赖后重试。');
    log.error('解决方案:');
    log.error(`  - 安装 Node.js (>= ${MIN_NODE_VERSION}): https://nodejs.org/`);
    process.exit(1);
  }

  return { pythonCmd, hasNodeServer: !!nodeVer };
}

// ─── 依赖安装 ─────────────────────────────────────────────────

function installDependencies(log, autoInstall) {
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  const packageJsonPath = path.join(__dirname, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    log.warn('未找到 package.json，跳过依赖安装。');
    return;
  }

  if (!autoInstall) {
    log.info('跳过依赖安装（--no-install）。');
    return;
  }

  if (fs.existsSync(nodeModulesPath)) {
    // 检查 node_modules 是否完整（简单验证 package.json 中的依赖是否都已安装）
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const deps = Object.keys(pkg.dependencies || {});
      const devDeps = Object.keys(pkg.devDependencies || {});
      const allDeps = [...deps, ...devDeps];
      const missing = allDeps.filter(d => !fs.existsSync(path.join(nodeModulesPath, d)));
      if (missing.length === 0) {
        log.debug('node_modules 已存在且完整，跳过安装。');
        return;
      }
      log.info(`发现 ${missing.length} 个缺失依赖，重新安装...`);
    } catch {
      log.debug('node_modules 已存在，跳过安装。');
      return;
    }
  }

  log.info('正在安装项目依赖...');
  try {
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    execSync(`${npmCmd} install`, { cwd: __dirname, stdio: 'inherit', timeout: 120000 });
    log.info('依赖安装完成。');
  } catch (e) {
    log.error('依赖安装失败。');
    log.error('解决方案:');
    log.error('  1. 检查网络连接');
    log.error('  2. 手动运行: npm install');
    log.error('  3. 清除缓存后重试: npm cache clean --force && npm install');
    log.error('  4. 跳过安装: node start.js --no-install');
    process.exit(1);
  }
}

// ─── 文件完整性校验 ───────────────────────────────────────────

function validateIntegrity(log) {
  const requiredFiles = [
    { path: 'index.html', desc: '游戏入口页面', minSize: 100 },
    { path: 'src/main.js', desc: '主程序入口', minSize: 10 },
    { path: 'src/config.js', desc: '游戏配置', minSize: 50 },
    { path: 'src/game.js', desc: '游戏核心逻辑', minSize: 100 },
  ];

  const optionalFiles = [
    { path: 'src/animation-mode.js', desc: '动画模式', minSize: 50 },
    { path: 'src/animation-creature.js', desc: '动画生物', minSize: 50 },
    { path: 'src/creature.js', desc: '生物模块', minSize: 50 },
    { path: 'src/creature-core.js', desc: '生物核心', minSize: 50 },
    { path: 'src/creature-renderer.js', desc: '生物渲染', minSize: 50 },
    { path: 'src/creature-states.js', desc: '生物状态', minSize: 50 },
    { path: 'src/game-mode.js', desc: '游戏模式', minSize: 50 },
    { path: 'src/input-handler.js', desc: '输入处理', minSize: 50 },
    { path: 'src/particle.js', desc: '粒子效果', minSize: 50 },
    { path: 'src/sound-manager.js', desc: '声音管理', minSize: 50 },
    { path: 'src/tail-chain.js', desc: '尾巴物理', minSize: 50 },
    { path: 'src/ui-controller.js', desc: 'UI控制器', minSize: 50 },
    { path: 'dev-assets/assets/frames', desc: '动画帧资源目录', isDir: true },
    { path: 'deploy/sw.js', desc: 'Service Worker' },
    { path: 'deploy/manifest.json', desc: 'PWA 清单' },
  ];

  let hasError = false;
  let warnings = 0;

  console.log('── 文件完整性校验 ──────────────────');

  // 必需文件检查
  for (const f of requiredFiles) {
    const fullPath = path.join(__dirname, f.path);
    const exists = fs.existsSync(fullPath);
    if (!exists) {
      console.log(`  [XX] ${f.path} (${f.desc}) - 缺失`);
      hasError = true;
      continue;
    }

    // 文件大小检查
    const stat = fs.statSync(fullPath);
    if (!f.isDir && stat.size < (f.minSize || 0)) {
      console.log(`  [!!] ${f.path} (${f.desc}) - 文件过小 (${formatBytes(stat.size)})，可能损坏`);
      warnings++;
      continue;
    }

    console.log(`  [OK] ${f.path} (${f.desc}) - ${f.isDir ? '目录' : formatBytes(stat.size)}`);
  }

  // 可选文件检查
  for (const f of optionalFiles) {
    const fullPath = path.join(__dirname, f.path);
    const exists = fs.existsSync(fullPath);
    if (!exists) {
      console.log(`  [  ] ${f.path} (${f.desc}) - 可选，缺失不影响运行`);
      continue;
    }

    const stat = fs.statSync(fullPath);
    console.log(`  [OK] ${f.path} (${f.desc}) - ${f.isDir ? '目录' : formatBytes(stat.size)}`);
  }

  // 引用完整性检查：验证 index.html 引用了所有核心模块
  const indexPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(indexPath)) {
    const htmlContent = fs.readFileSync(indexPath, 'utf-8');
    const expectedRefs = ['src/main.js'];
    for (const ref of expectedRefs) {
      if (!htmlContent.includes(ref)) {
        console.log(`  [!!] index.html 未引用 ${ref}`);
        warnings++;
      }
    }
  }

  // 模块引用链检查：验证 main.js 导入了核心模块
  const mainPath = path.join(__dirname, 'src/main.js');
  if (fs.existsSync(mainPath)) {
    const mainContent = fs.readFileSync(mainPath, 'utf-8');
    const coreImports = ['./game.js'];
    for (const imp of coreImports) {
      if (!mainContent.includes(imp)) {
        console.log(`  [!!] src/main.js 未导入 ${imp}`);
        warnings++;
      }
    }
  }

  // 动画帧资源数量检查
  const framesDir = path.join(__dirname, 'dev-assets/assets/frames');
  if (fs.existsSync(framesDir)) {
    const frames = fs.readdirSync(framesDir).filter(f => f.endsWith('.jpg'));
    if (frames.length === 0) {
      console.log('  [!!] 动画帧资源目录为空');
      warnings++;
    } else {
      log.debug(`  动画帧数量: ${frames.length}`);
    }
  }

  console.log('');

  if (hasError) {
    log.error('关键文件缺失，游戏无法正常运行。');
    log.error('解决方案:');
    log.error('  1. 确认项目完整性，重新拉取代码');
    log.error('  2. 检查文件是否被误删或移动');
    log.error('  3. 跳过校验: node start.js --no-verify');
    process.exit(1);
  }

  if (warnings > 0) {
    log.warn(`发现 ${warnings} 个警告，游戏可能存在异常。`);
  }
}

// ─── 运行参数自动配置 ─────────────────────────────────────────

function injectRuntimeConfig(log, mode, port) {
  if (mode === 'test') {
    log.debug('测试模式，跳过参数注入。');
    return;
  }

  const configPath = path.join(__dirname, 'src', 'config.js');
  if (!fs.existsSync(configPath)) {
    log.warn('src/config.js 不存在，跳过参数注入。');
    return;
  }

  // 根据模式调整运行参数
  const runtimeOverrides = {};

  if (mode === 'prod') {
    runtimeOverrides.fps = 60;
    runtimeOverrides.particleCount = 6;
    runtimeOverrides.maxParticles = 150;
  } else if (mode === 'dev') {
    runtimeOverrides.fps = 60;
    runtimeOverrides.particleCount = 8;
    runtimeOverrides.maxParticles = 200;
  }

  // 检测系统性能，自动调整
  const totalMemMB = os.totalmem() / (1024 * 1024);
  if (totalMemMB < 2048) {
    log.info('检测到低内存环境，降低粒子效果。');
    runtimeOverrides.maxParticles = Math.min(runtimeOverrides.maxParticles || 200, 80);
    runtimeOverrides.particleCount = Math.min(runtimeOverrides.particleCount || 8, 4);
  }

  // 写入运行时配置文件（不修改源 config.js）
  const runtimeConfigPath = path.join(__dirname, 'src', 'runtime-config.js');
  const configContent = `// 运行时自动生成 - 由 start.js 注入
// 此文件由启动脚本自动创建，不应手动编辑
const RUNTIME_CONFIG = Object.freeze(${JSON.stringify(runtimeOverrides, null, 2)});

export { RUNTIME_CONFIG };
`;

  try {
    fs.writeFileSync(runtimeConfigPath, configContent, 'utf-8');
    log.debug(`运行时配置已写入: src/runtime-config.js`);
    log.debug(`  参数: ${JSON.stringify(runtimeOverrides)}`);
  } catch (e) {
    log.warn(`运行时配置写入失败: ${e.message}`);
  }
}

// ─── 服务启动 ─────────────────────────────────────────────────

async function startServer(log, port, mode, envInfo) {
  // 检查端口占用
  if (await isPortInUse(port)) {
    log.warn(`端口 ${port} 已被占用。`);
    try {
      const newPort = await findAvailablePort(port + 1);
      log.info(`自动切换到可用端口: ${newPort}`);
      port = newPort;
    } catch {
      log.error(`在 ${port}-${port + 10} 范围内未找到可用端口。`);
      log.error('解决方案:');
      log.error('  1. 指定其他端口: node start.js --port <端口号>');
      log.error('  2. 关闭占用端口的程序');
      if (process.platform === 'win32') {
        log.error(`  3. Windows 查看端口占用: netstat -ano | findstr :${port}`);
      } else {
        log.error(`  3. macOS/Linux 查看端口占用: lsof -i :${port}`);
      }
      process.exit(1);
    }
  }

  const url = `http://localhost:${port}`;

  // 优先使用 Node.js 内置简易服务器
  if (envInfo.hasNodeServer) {
    return startNodeServer(log, port, mode, url);
  }

  // 回退到 Python
  if (envInfo.pythonCmd) {
    return startPythonServer(log, port, envInfo.pythonCmd, url);
  }

  log.error('无可用的服务器引擎。');
  log.error('请安装 Node.js (>= 14) 或 Python 3。');
  process.exit(1);
}

function startNodeServer(log, port, mode, url) {
  log.info(`使用 Node.js 启动服务器 (模式: ${mode})`);

  // 创建支持 ES Module 的简易静态服务器
  const serverScript = `
const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.mp3':  'audio/mpeg',
  '.wav':  'audio/wav',
  '.mp4':  'video/mp4',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

const ROOT = ${JSON.stringify(__dirname)};
const MODE = ${JSON.stringify(mode)};

const server = http.createServer((req, res) => {
  let filePath = path.join(ROOT, req.url.split('?')[0]);

  // 目录则返回 index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('500 Internal Server Error');
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': MODE === 'prod' ? 'max-age=3600' : 'no-cache',
    });
    res.end(data);
  });
});

server.listen(${port}, () => {
  console.log('服务器已启动: ${url}');
  console.log('按 Ctrl+C 停止服务器');
});
`;

  const child = spawn('node', ['-e', serverScript], { cwd: __dirname, stdio: 'inherit' });

  child.on('error', (err) => {
    log.error(`服务器启动失败: ${err.message}`);
    log.error('诊断信息:');
    log.error('  - 检查 Node.js 是否正常安装');
    log.error('  - 检查端口是否被占用');
    log.error('  - 尝试使用其他端口: node start.js --port <端口号>');
    process.exit(1);
  });

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      log.error(`服务器异常退出 (代码: ${code})`);
      if (code === 1) log.error('  可能原因: 端口被占用或权限不足');
      if (code === 139) log.error('  可能原因: 内存不足 (OOM)');
    }
    process.exit(code ?? 0);
  });

  // 优雅退出
  const shutdown = () => {
    log.info('\n正在关闭服务器...');
    child.kill('SIGTERM');
    setTimeout(() => process.exit(0), 1000);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return { url, child };
}

function startPythonServer(log, port, pythonCmd, url) {
  log.info(`使用 Python 启动服务器`);

  const child = spawn(pythonCmd, ['-m', 'http.server', String(port)], {
    cwd: __dirname,
    stdio: 'inherit',
  });

  child.on('error', (err) => {
    log.error(`服务器启动失败: ${err.message}`);
    log.error('诊断信息:');
    log.error('  - 检查 Python 是否正常安装');
    log.error('  - 尝试安装 Node.js 以获得更好的体验');
    process.exit(1);
  });

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      log.error(`服务器异常退出 (代码: ${code})`);
    }
    process.exit(code ?? 0);
  });

  const shutdown = () => {
    log.info('\n正在关闭服务器...');
    child.kill('SIGTERM');
    setTimeout(() => process.exit(0), 1000);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return { url, child };
}

// ─── 主流程 ───────────────────────────────────────────────────

async function main() {
  const rawArgs = parseArgs(process.argv);
  const args = validateArgs(loadConfigFile(rawArgs));
  const log = createLogger(args.log, args.logToFile);

  console.log('');
  console.log('  =^..^=  猫咪捕猎游戏 - 一键启动 v' + SCRIPT_VERSION);
  console.log('');

  log.info(`启动参数: 端口=${args.port}, 模式=${args.mode}, 日志=${args.log}`);

  // 1. 环境检查
  const envInfo = checkEnvironment(log);

  // 2. 依赖安装
  installDependencies(log, args.autoInstall);

  // 3. 文件完整性校验
  if (args.verifyIntegrity) {
    validateIntegrity(log);
  } else {
    log.info('跳过文件完整性校验（--no-verify）。');
  }

  // 4. 运行参数自动配置
  if (args.injectConfig) {
    injectRuntimeConfig(log, args.mode, args.port);
  }

  // 仅检查模式
  if (args.check) {
    console.log('环境检查通过，所有关键文件就绪。');
    log.close();
    process.exit(0);
  }

  // 5. 启动服务
  console.log('── 启动服务 ──────────────────────');
  const { url } = await startServer(log, args.port, args.mode, envInfo);

  // 6. 打开浏览器
  if (args.open) {
    setTimeout(() => openBrowser(url), 500);
  }

  log.info(`游戏地址: ${url}`);
  if (args.mode === 'dev') {
    log.info('开发模式: 文件修改后刷新浏览器即可看到更新');
  } else if (args.mode === 'prod') {
    log.info('生产模式: 已启用缓存优化');
  }
}

main().catch((err) => {
  console.error('[FATAL]', err.message);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
