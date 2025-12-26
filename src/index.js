
import { monitor } from './commands/monitor.js';
import { crash } from './commands/crash.js';
import { ls } from './commands/ls.js';
import { startServer } from './server/index.js';

export function run(args) {
    // console.log("Received arguments:", args);
    // Remove the first two args (node binary and script path) to get actual user input
    const userArgs = args.slice(2);
    
    if (userArgs.length === 0) {
        console.log("No command provided. Try 'sentinel monitor'");
        return;
    }
    
    const command = userArgs[0];
    const arg1 = userArgs[1]; // 第二个参数，作为 ls 的目录路径
    
    if (command === 'monitor') {
        monitor();
    } else if (command === 'crash') {
        crash();
    } else if (command === 'ls') {
        // 如果用户没传 arg1，ls 函数里有默认值 '.'
        ls(arg1);
    } else if (command === 'start') {
        startServer();
    } else {
        console.log(`Unknown command: ${command}`);
    }
}
