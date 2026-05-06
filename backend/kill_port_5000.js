const { execSync } = require('child_process');

try {
    const output = execSync('netstat -ano | findstr :5000').toString();
    const lines = output.split('\n');
    const pids = new Set();
    for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length > 4) {
            const pid = parts[parts.length - 1];
            if (pid && pid !== '0') pids.add(pid);
        }
    }
    for (const pid of pids) {
        console.log(`Killing process ${pid}...`);
        try {
            execSync(`taskkill /F /PID ${pid}`);
        } catch (e) {
            console.error(`Failed to kill ${pid}: ${e.message}`);
        }
    }
    console.log('Done.');
} catch (e) {
    console.log('No process found on port 5000 or error: ' + e.message);
}
