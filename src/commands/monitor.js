
// 引入 Node.js 内置模块
// 'os': 操作系统层面的信息（CPU、内存总量、运行时间等）
import os from 'os';
// 'v8': Node.js 的引擎核心，能看到 JS 堆内存的极限限制
import v8 from 'v8';
// 'process': 当前 Node.js 进程的信息（在这个脚本跑起来的时候，它占用了多少资源）
import process from 'process';

/**
 * 辅助函数：把字节 (Bytes) 转换成人类能看懂的 KB, MB, GB
 * 比如：formatBytes(1024) -> "1 KB"
 */
const formatBytes = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    // Math.log(bytes) / Math.log(1024) 用来计算是第几级单位 (0是Bytes, 1是KB, 2是MB...)
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    // Math.pow(1024, i) 算出那个单位的基数，然后除一下
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
};

/**
 * 核心考点：如何计算 CPU 使用率？
 * Node.js 的 os.cpus() 返回的是一个数组，包含每个 CPU 核从"开机到现在"的毫秒数。
 * 这些时间分为：user(用户态), nice, sys(内核态), idle(空闲), irq(中断)。
 * 
 * 我们不能直接读这个数字，因为它是一个"总量"。
 * 我们需要做的是：
 * 1. 拍一张快照 (Start)
 * 2. 也是等一秒
 * 3. 拍第二张快照 (End)
 * 4. (End - Start) 就是这一秒内 CPU 过的日子。
 * 5. 使用率 = (总时间 - 空闲时间) / 总时间
 */
function getCpuSnapshot() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
        // 遍历这个核的所有时间状态 (user, nice, sys, idle, irq) 加起来就是总时间
        for (const type in cpu.times) {
            totalTick += cpu.times[type];
        }
        // 单独记录空闲时间
        totalIdle += cpu.times.idle;
    });

    return { totalIdle, totalTick };
}

// 用来存储"上一次"的快照，用来做对比
let lastCpuSnapshot = null;

function getCpuUsage() {
    const currentSnapshot = getCpuSnapshot();
    
    // 如果是第一次运行，没有"上一次"的数据，没法对比，只能返回 0
    if (!lastCpuSnapshot) {
        lastCpuSnapshot = currentSnapshot;
        return 0; 
    }

    // 计算差值：现在的 - 上一次的
    const idleDiff = currentSnapshot.totalIdle - lastCpuSnapshot.totalIdle;
    const totalDiff = currentSnapshot.totalTick - lastCpuSnapshot.totalTick;
    
    // 更新"上一次"的快照，为下这一秒做准备
    lastCpuSnapshot = currentSnapshot;
    
    // 公式：使用率 = 1 - 空闲率
    const usage = 1 - (idleDiff / totalDiff);
    return (usage * 100).toFixed(2); // 保留两位小数
}

export function monitor() {
    // console.clear() 清空终端屏幕，让它看起来像一个实时面板
    console.clear();
    console.log("Sentinel System Monitor (Ctrl+C to exit)");
    console.log("----------------------------------------");

    // setInterval: 每 1000 毫秒 (1秒) 执行一次里面的代码
    setInterval(() => {
        // --- 1. 获取系统基础信息 (OS Module) ---
        
        // 系统运行时间 (秒)
        const uptime = os.uptime(); 
        // 刚才算出来的 CPU 使用率
        const cpuUsage = getCpuUsage();
        // 系统负载：[1分钟平均负载, 5分钟, 15分钟]
        // 如果这个数字超过了你的 CPU 核数，说明电脑卡爆了
        const loadAvg = os.loadavg(); 

        // --- 2. 内存分析 (OS + Process + V8) ---
        
        // 电脑总内存 (比如 16GB)
        const totalMem = os.totalmem();
        // 电脑还剩多少内存没用
        const freeMem = os.freemem();
        // 算一下已经用了多少
        const usedMem = totalMem - freeMem;
        
        // --- 核心考点：Process Memory (Node.js 进程内存) ---
        // 这是面试最喜欢问的：Node.js 到底占了多少内存？
        const memUsage = process.memoryUsage();
        
        // --- 高级考点：V8 Heap Limits ---
        // 這是 JS 引擎的物理极限制
        const heapStats = v8.getHeapStatistics();

        // 开始打印！
        console.clear(); // 再次清屏，刷新数据
        console.log(`\n=== 🖥️  SYSTEM HEARTBEAT (系统心跳) ===`);
        console.log(`Uptime (运行时间) : ${uptime}s`);
        console.log(`CPU Usage (CPU使用): ${cpuUsage}%`);
        // map/toFixed 是为了把小数点限制在2位
        console.log(`Load Avg (平均负载): ${loadAvg.map(l => l.toFixed(2)).join(', ')}`);
        
        console.log(`\n=== 🧠 SYSTEM MEMORY (系统总内存) ===`);
        console.log(`Total (总共)      : ${formatBytes(totalMem)}`);
        // 算出百分比
        console.log(`Used (已用)       : ${formatBytes(usedMem)} (${((usedMem/totalMem)*100).toFixed(1)}%)`);
        console.log(`Free (空闲)       : ${formatBytes(freeMem)}`);

        console.log(`\n=== 📦 NODE.JS PROCESS MEMORY (当前脚本占用的内存 - 面试必问) ===`);
        // RSS (Resident Set Size): 常驻内存。
        // 這是操作系统看到的"这個程序占了多少地"。
        // 包含了：所有代码 + 栈内存 + 堆内存 (Heap)。它是最大的一个值。
        console.log(`RSS (物理总占用)   : ${formatBytes(memUsage.rss)}`);
        
        // HeapTotal: V8 引擎向操作系统"申请"了多少堆内存。
        // 为了性能，V8 会预先多申请一点，不一定全用了。
        console.log(`HeapTotal (堆申请): ${formatBytes(memUsage.heapTotal)}`);
        
        // HeapUsed: 真正存放 JS 对象 (String, Object, Closure) 的地方。
        // 如果这个值一直在涨，从不掉下来，那就是内存泄漏！
        console.log(`HeapUsed (堆实际) : ${formatBytes(memUsage.heapUsed)}`);
        
        // External: 这里的内存不在 V8 的堆里，而是 C++ 对象。
        // 比如你用 fs.readFile 读进来的 Buffer，或者 DOM 节点（如果是浏览器）。
        // 这是排查 Buffer 内存泄漏的关键。
        console.log(`External (C++外挂): ${formatBytes(memUsage.external)}`);
        
        console.log(`\n=== ⚙️  V8 HEAP LIMITS (引擎极限) ===`);
        // Node.js 能用的最大堆内存。超过这个值，程序就会崩溃 (OOM)。
        // 也就是为什么有时候我们需要运行 node --max-old-space-size=8192 ...
        console.log(`Heap Size Limit   : ${formatBytes(heapStats.heap_size_limit)}`);
        console.log(`Used Heap Size    : ${formatBytes(heapStats.used_heap_size)}`);

    }, 1000); // 1000ms = 1秒
}
