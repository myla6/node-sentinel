
import fs from 'fs/promises';

/**
 * 分析文件内容，返回元数据
 * 重点：不读取整个文件，只读头部几个字节
 */
export async function analyzeFile(filePath) {
    let handle = null;
    try {
        // 'r' = 只读模式
        handle = await fs.open(filePath, 'r');
        
        // 1. 创建一个 32 字节的 Buffer (缓冲区)
        // 也就是只在内存里开辟 32 字节的小空间，不管文件有几 GB
        const buffer = Buffer.alloc(32);
        
        // 2. 从文件里读取前 32 个字节，填充到 buffer 里
        // read(buffer, offset, length, position)
        await handle.read(buffer, 0, 32, 0);

        // 3. 核心考点：判定是否为 PNG
        // PNG 的前 8 个字节是固定的魔数 (Magic Bytes): 
        // 89 50 4E 47 0D 0A 1A 0A
        // 0x89 + 'P' 'N' 'G' ...
        const isPNG = 
            buffer[0] === 0x89 &&
            buffer[1] === 0x50 && // P
            buffer[2] === 0x4E && // N
            buffer[3] === 0x47;   // G
            
        if (isPNG) {
            // PNG 协议规定：
            // 宽度在第 16-20 字节 (4 bytes, 32-bit Integer)
            // 高度在第 20-24 字节
            // readUInt32BE = Read Unsigned Integer 32-bit Big Endian (大端序)
            const width = buffer.readUInt32BE(16);
            const height = buffer.readUInt32BE(20);
            
            return `[PNG ${width}x${height}]`;
        }

        return '';
    } catch (e) {
        // 读不到就算了，不报错
        return '';
    } finally {
        // 千万别忘了关文件句柄！否则文件会被占用
        if (handle) await handle.close();
    }
}
