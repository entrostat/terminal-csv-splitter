import { Command, flags } from '@oclif/command';
import * as path from 'path';
import { assertFileExists } from './assert-file-exists';

class TerminalCsvSplitter extends Command {
    static description = 'describe the command here';

    static flags = {
        version: flags.version({ char: 'v' }),
        help: flags.help({ char: 'h' }),
        lines: flags.integer({
            char: 'l',
            description: 'The number of lines per file',
        }),
        header: flags.boolean({
            char: 'h',
            description: 'Whether there is a header in the file',
            default: true,
        }),
        out: flags.string({
            char: 'o',
            description: 'The output directory',
            default: './split-files',
        }),
    };

    static args = [{ name: 'file' }];

    async run() {
        const { args, flags } = this.parse(TerminalCsvSplitter);
        const filePath = path.resolve(args.file);
        await assertFileExists(filePath, () => this.error(`The file ${args.file} does not exist...`));
    }
}

export = TerminalCsvSplitter;
