
import fs from 'fs/promises';
import path from 'path';

/**
 * 核心考点：为什么不用 fs.readdir？
 * 
 * fs.readdir(dir) 会一次性把目录下所有文件名读到一个 Array 里。
 * 如果这个目录下有 100万个文件，你的内存(Array)瞬间就很大。
 * 
 * fs.opendir(dir) 返回的是一个 "Dir" 对象，它是一个 "Async Iterator" (异步迭代器)。
 * 它像水龙头一样，在这个 `for await` 循环里，你每次只要一个文件，它就只去硬盘里读一个。
 * 极其节省内存！适合处理海量文件。
 */


import { analyzeFile } from '../utils/analyzer.js';

/**
 * 递归扫描函数
 * depth: 当前递归深度，用来画缩进
 */
async function scanDir(currentPath, depth = 0) {
    try {
        const dir = await fs.opendir(currentPath);
        // 画缩进：深度越深，空格越多
        const prefix = '│  '.repeat(depth); 
        const leaf = '├──';

        for await (const dirent of dir) {
            // 忽略 .git 和 node_modules，否则刷屏刷到死
            if (dirent.name === '.git' || dirent.name === 'node_modules') continue;

            let icon = '📄';
            let extraInfo = '';

            if (dirent.isDirectory()) {
                icon = '📂';
            } else {
                // 如果是文件，尝试分析一下
                const fullPath = path.join(currentPath, dirent.name);
                extraInfo = await analyzeFile(fullPath);
                // 如果有额外信息，加个高亮颜色 (用 ANSI 转义码，比如 \x1b[36mCyan\x1b[0m)
                if (extraInfo) extraInfo = ` \x1b[36m${extraInfo}\x1b[0m`;
            }
            
            console.log(`${prefix}${leaf} ${icon} ${dirent.name}${extraInfo}`);

            // 核心递归逻辑：如果是文件夹，就自己调用自己，深度 +1
            if (dirent.isDirectory()) {
                const subPath = path.join(currentPath, dirent.name);
                await scanDir(subPath, depth + 1);
            }
        }
    } catch (err) {
        console.error(`❌ Error reading directory: ${err.message}`);
    }
}

export async function ls(dirPath = '.') {
    const absolutePath = path.resolve(process.cwd(), dirPath);
    console.log(`Scanning Tree: ${absolutePath} ...\n`);
    await scanDir(absolutePath);
    console.log('\nScan complete. ✅');
}
