import { Command, flags } from '@oclif/command';
import * as path from 'path';
import { assertFileExists } from './assert-file-exists';
import * as fs from 'fs-extra';
import { removeExtension } from './remove-extension';
import { v4 as uuid } from 'uuid';
import { execute } from './execute';

class TerminalCsvSplitter extends Command {
    static description = 'describe the command here';

    static flags = {
        version: flags.version({ char: 'v' }),
        help: flags.help({ char: 'h' }),
        lines: flags.integer({
            char: 'l',
            description: 'The number of lines per file',
            required: true,
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

        this.log(
            `Splitting ${args.file} into files of ${flags.lines} lines each, ${
                flags.header ? 'headers are enabled' : 'headers are not enabled'
            }...`,
        );

        await fs.mkdirp(path.resolve(flags.out));
        const blockName = removeExtension(args.file);
        const suffix = `${uuid().toString()}_BLOCK_`;
        const outputPath = path.resolve(flags.out, suffix);

        await execute(`split -l ${flags.lines} ${filePath} ${outputPath}`);
    }
}

export = TerminalCsvSplitter;
