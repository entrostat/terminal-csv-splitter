import { exec } from 'child_process';

export async function execute<T = string>(command: string) {
    return new Promise<T>((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                return reject(stderr);
            }
            // @ts-ignore
            resolve(stdout);
        });
    });
}
