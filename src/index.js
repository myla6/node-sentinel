
import { monitor } from './commands/monitor.js';
import { crash } from './commands/crash.js';

export function run(args) {
    // console.log("Received arguments:", args);
    // Remove the first two args (node binary and script path) to get actual user input
    const userArgs = args.slice(2);
    
    if (userArgs.length === 0) {
        console.log("No command provided. Try 'sentinel monitor'");
        return;
    }
    
    const command = userArgs[0];
    
    if (command === 'monitor') {
        monitor();
    } else if (command === 'crash') {
        crash();
    } else {
        console.log(`Unknown command: ${command}`);
    }
}
