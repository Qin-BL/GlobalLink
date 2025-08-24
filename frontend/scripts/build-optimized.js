const { spawn } = require('child_process');
const os = require('os');

// 根据系统内存自动调整Node内存限制
function getOptimalMemory() {
  const totalMem = os.totalmem();
  const gb = totalMem / 1024 / 1024 / 1024;
  
  if (gb >= 8) return 6144; // 6GB for 8GB+ systems
  if (gb >= 4) return 4096; // 4GB for 4GB+ systems
  return 2048; // 2GB for lower memory systems
}

const memoryLimit = getOptimalMemory();
console.log(`系统内存: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(1)}GB`);
console.log(`使用内存限制: ${memoryLimit}MB`);

const buildProcess = spawn('npm', ['run', 'build'], {
  env: {
    ...process.env,
    NODE_OPTIONS: `--max-old-space-size=${memoryLimit}`,
    GENERATE_SOURCEMAP: 'false',
    INLINE_RUNTIME_CHUNK: 'false'
  },
  stdio: 'inherit'
});

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ 构建成功完成！');
  } else {
    console.error('❌ 构建失败，错误码:', code);
    process.exit(code);
  }
});