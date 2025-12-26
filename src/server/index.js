
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM 里面没有 __dirname，所以要自己算
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

export function startServer() {
    const server = http.createServer((req, res) => {
        console.log(`[REQUEST] ${req.method} ${req.url}`);

        // 1. 路由逻辑 (Router)
        if (req.url === '/' || req.url === '/index.html') {
            // 返回 HTML 页面
            const htmlPath = path.join(__dirname, 'public', 'index.html');
            
            // 使用 Stream (流) 来读取文件并 pipe 给 response
            // 这是 Node.js 处理静态文件最高效的方式
            const readStream = fs.createReadStream(htmlPath);
            
            res.writeHead(200, { 'Content-Type': 'text/html' });
            readStream.pipe(res);
            
        } else if (req.url === '/api/status') {
            // 2. API 接口: 返回 JSON 数据
            const data = {
                cpu: process.cpuUsage(),
                memory: process.memoryUsage(),
                uptime: process.uptime()
            };
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
            
        } else {
            // 3. 404 处理
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found - Sentinel');
        }
    });

    server.listen(PORT, () => {
        console.log(`
🚀 Sentinel Server is running!
👉 Dashboard: http://localhost:${PORT}
        `);
    });
}
