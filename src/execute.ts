import { exec } from 'child_process';

export async function execute(command: string) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                return reject(stderr);
            }
            resolve(stdout);
        });
    });
}
