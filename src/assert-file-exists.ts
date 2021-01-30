// @ts-ignore
import * as fs from 'fs-extra';
export async function assertFileExists(filePath: string, failureCallback: () => void) {
    try {
        await fs.access(filePath);
    } catch (e) {
        failureCallback();
    }
}
