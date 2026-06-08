#!/usr/bin/env node
/**
 * 猫咪捕猎游戏 - 一键启动脚本
 *
 * 功能：
 *   - 环境检查（Node.js / Python / 浏览器）
 *   - 依赖项安装（npm install）
 *   - 配置文件验证（index.html, src/main.js, src/config.js）
 *   - 静态服务启动（优先 Node，回退 Python）
 *   - 命令行参数自定义（端口、模式、日志级别等）
 *   - 错误处理与解决方案提示
 *
 * 用法：
 *   node start.js [选项]
 *   node start.js --port 3000 --mode dev --log debug
 *   node start.js --help
 */

'use strict';

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// ─── 命令行参数解析 ───────────────────────────────────────────

function parseArgs(argv) {
  const args = { port: 8080, mode: 'dev', log: 'info', open: true, check: false };
  const i = 2; // 跳过 node 和脚本名
  for (let j = i; j < argv.length; j++) {
    const arg = argv[j];
    switch (arg) {
      case '--port':
      case '-p':
        args.port = parseInt(argv[++j], 10);
        break;
      case '--mode':
      case '-m':
        args.mode = argv[++j];
        break;
      case '--log':
      case '-l':
        args.log = argv[++j];
        break;
      case '--no-open':
        args.open = false;
        break;
      case '--check':
      case '-c':
        args.check = true;
        break;
      case '--help':
      case '-h':
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

function printHelp() {
  console.log(`
猫咪捕猎游戏 - 一键启动脚本

用法: node start.js [选项]

选项:
  -p, --port <端口号>    服务端口 (默认: 8080)
  -m, --mode <模式>      启动模式: dev | prod | test (默认: dev)
  -l, --log <级别>       日志级别: debug | info | warn | error (默认: info)
  --no-open              不自动打开浏览器
  -c, --check            仅运行环境检查，不启动服务
  -h, --help             显示帮助信息

示例:
  node start.js                      # 默认启动 (端口 8080)
  node start.js --port 3000          # 指定端口 3000
  node start.js --mode prod          # 生产模式启动
  node start.js --log debug          # 调试日志
  node start.js --check              # 仅检查环境
`);
}

// ─── 日志工具 ─────────────────────────────────────────────────

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

function createLogger(level) {
  const lv = LOG_LEVELS[level] ?? LOG_LEVELS.info;
  const prefix = { debug: '[DEBUG]', info: '[INFO]', warn: '[WARN]', error: '[ERROR]' };
  return {
    debug: (...m) => lv <= 0 && console.log(prefix.debug, ...m),
    info: (...m) => lv <= 1 && console.log(prefix.info, ...m),
    warn: (...m) => lv <= 2 && console.warn(prefix.warn, ...m),
    error: (...m) => lv <= 3 && console.error(prefix.error, ...m),
  };
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

// ─── 环境检查 ─────────────────────────────────────────────────

function checkEnvironment(log) {
  const results = [];
  let hasBlocker = false;

  // Node.js 检查
  const nodeVer = getVersion('node');
  if (nodeVer) {
    const major = parseInt(nodeVer.replace(/^v/, '').split('.')[0], 10);
    if (major >= 14) {
      results.push({ name: 'Node.js', status: 'ok', detail: nodeVer });
    } else {
      results.push({ name: 'Node.js', status: 'error', detail: `${nodeVer} (需要 >= 14)` });
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

  // 打印结果
  console.log('\n── 环境检查 ──────────────────────');
  for (const r of results) {
    const icon = r.status === 'ok' ? '✓' : r.status === 'warn' ? '!' : '✗';
    const color = r.status === 'ok' ? '' : r.status === 'warn' ? '' : '';
    console.log(`  ${icon} ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (hasBlocker) {
    log.error('环境检查未通过，请安装缺失的依赖后重试。');
    log.error('解决方案:');
    log.error('  - 安装 Node.js: https://nodejs.org/');
    process.exit(1);
  }

  return { pythonCmd, hasNodeServer: !!nodeVer };
}

// ─── 依赖安装 ─────────────────────────────────────────────────

function installDependencies(log) {
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  const packageJsonPath = path.join(__dirname, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    log.warn('未找到 package.json，跳过依赖安装。');
    return;
  }

  if (fs.existsSync(nodeModulesPath)) {
    log.debug('node_modules 已存在，跳过安装。');
    return;
  }

  log.info('正在安装项目依赖...');
  try {
    execSync('npm install', { cwd: __dirname, stdio: 'inherit', timeout: 120000 });
    log.info('依赖安装完成。');
  } catch (e) {
    log.error('依赖安装失败。');
    log.error('解决方案:');
    log.error('  1. 检查网络连接');
    log.error('  2. 手动运行: npm install');
    log.error('  3. 清除缓存后重试: npm cache clean --force && npm install');
    process.exit(1);
  }
}

// ─── 配置文件验证 ─────────────────────────────────────────────

function validateConfig(log) {
  const requiredFiles = [
    { path: 'index.html', desc: '游戏入口页面' },
    { path: 'src/main.js', desc: '主程序入口' },
    { path: 'src/config.js', desc: '游戏配置' },
    { path: 'src/game.js', desc: '游戏核心逻辑' },
  ];

  const optionalFiles = [
    { path: 'dev-assets/assets/frames', desc: '动画帧资源目录', isDir: true },
    { path: 'deploy/sw.js', desc: 'Service Worker' },
    { path: 'deploy/manifest.json', desc: 'PWA 清单' },
  ];

  let hasError = false;

  console.log('── 配置验证 ──────────────────────');

  for (const f of requiredFiles) {
    const fullPath = path.join(__dirname, f.path);
    const exists = f.isDir ? fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()
      : fs.existsSync(fullPath);
    if (exists) {
      console.log(`  ✓ ${f.path} (${f.desc})`);
    } else {
      console.log(`  ✗ ${f.path} (${f.desc}) - 缺失`);
      hasError = true;
    }
  }

  for (const f of optionalFiles) {
    const fullPath = path.join(__dirname, f.path);
    const exists = fs.existsSync(fullPath);
    if (exists) {
      console.log(`  ✓ ${f.path} (${f.desc})`);
    } else {
      console.log(`  ! ${f.path} (${f.desc}) - 可选，缺失不影响运行`);
    }
  }

  // 验证 index.html 中引用了 main.js
  const indexPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf-8');
    if (!content.includes('src/main.js')) {
      console.log('  ! index.html 未引用 src/main.js');
    }
  }

  console.log('');

  if (hasError) {
    log.error('关键文件缺失，游戏可能无法正常运行。');
    log.error('解决方案:');
    log.error('  1. 确认项目完整性，重新拉取代码');
    log.error('  2. 检查文件是否被误删或移动');
    process.exit(1);
  }
}

// ─── 服务启动 ─────────────────────────────────────────────────

async function startServer(log, port, mode, envInfo) {
  // 检查端口占用
  if (await isPortInUse(port)) {
    log.error(`端口 ${port} 已被占用。`);
    log.error('解决方案:');
    log.error(`  1. 使用其他端口: node start.js --port ${port + 1}`);
    log.error(`  2. 释放端口: 查找并关闭占用端口的进程`);
    process.exit(1);
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
  log.error('请安装 Node.js (>=14) 或 Python 3。');
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
      'Cache-Control': '${mode === 'prod' ? 'max-age=3600' : 'no-cache'}',
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
    process.exit(1);
  });

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      log.error(`服务器异常退出 (代码: ${code})`);
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
  const args = parseArgs(process.argv);
  const log = createLogger(args.log);

  console.log('');
  console.log('  🐱 猫咪捕猎游戏 - 一键启动');
  console.log('');

  // 1. 环境检查
  const envInfo = checkEnvironment(log);

  // 2. 依赖安装
  installDependencies(log);

  // 3. 配置验证
  validateConfig(log);

  // 仅检查模式
  if (args.check) {
    console.log('环境检查通过，所有关键文件就绪。');
    process.exit(0);
  }

  // 4. 启动服务
  console.log('── 启动服务 ──────────────────────');
  const { url } = await startServer(log, args.port, args.mode, envInfo);

  // 5. 打开浏览器
  if (args.open) {
    setTimeout(() => openBrowser(url), 500);
  }

  log.info(`游戏地址: ${url}`);
  if (args.mode === 'dev') {
    log.info('开发模式: 文件修改后刷新浏览器即可看到更新');
  }
}

main().catch((err) => {
  console.error('[FATAL]', err.message);
  process.exit(1);
});
