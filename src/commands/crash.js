
import v8 from 'v8';
import process from 'process';

export function crash() {
    console.log("🔥 PREPARING TO CRASH V8 (High Speed Mode)...");
    
    // 获取当前堆内存限制
    const limit = v8.getHeapStatistics().heap_size_limit / 1024 / 1024;
    console.log(`💀 V8 Heap Limit: ${limit.toFixed(2)} MB`);
    console.log("------------------------------------------");

    // 存放在全局，防止被 GC 回收
    const leak = [];
    
    let count = 0;

    // 每 20 毫秒执行一次，速度极快
    setInterval(() => {
        try {
            // 每次造一个 10MB 左右的对象结构
            // 使用对象而不是纯字符串，更容易占满 JS Heap
            const chunk = {
                id: count++,
                // 填充一个 100万长度的数组
                data: new Array(1000 * 100).fill('MEMORY_LEAK_TEST_STRING') 
            };
            
            leak.push(chunk);

            // 获取当前内存使用情况
            const mem = process.memoryUsage();
            const used = mem.heapUsed / 1024 / 1024;
            const total = mem.heapTotal / 1024 / 1024;

            console.log(`💥 Eating Memory... | Heap: ${used.toFixed(2)} MB / ${limit.toFixed(2)} MB | Objects: ${leak.length}`);
            
        } catch (e) {
            console.error("❌ CRASHED!");
            console.error(e);
            process.exit(1);
        }
    }, 20);
}
