import { Command, flags } from '@oclif/command';
import * as path from 'path';
import { assertFileExists } from './assert-file-exists';
import * as fs from 'fs-extra';
import { removeExtension } from './remove-extension';
import { v4 as uuid } from 'uuid';
import { execute } from './execute';
import { Promax } from 'promax';
import * as os from 'os';

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

        const outputDirectory = path.resolve(flags.out);
        await fs.mkdirp(outputDirectory);
        const suffix = uuid().toString();
        const outputPath = path.join(outputDirectory, suffix);

        await execute(`split -l ${flags.lines} ${filePath} ${outputPath}`);

        const allFileList = await fs.readdir(outputDirectory);

        const fileList = allFileList
            .filter((fileName) => fileName.indexOf(suffix) > -1)
            .sort()
            .map((fileName) => path.join(outputDirectory, fileName));

        this.log(`Split ${args.file} into ${fileList.length} files!`);

        if (flags.header) {
            try {
                await this.addHeadersToFiles(fileList);
            } catch (e) {
                this.error(e.message);
            }
        }

        this.log(`Renaming files...`);
        try {
            await this.renameFiles(fileList, filePath);
        } catch (e) {
            this.error(e.message);
        }

        this.log(`Finished splitting ${args.file} into ${fileList.length} files, check ${outputDirectory} for the result!`);
    }

    private async getHeaders(filePath: string): Promise<string> {
        const headers = await execute(`head -n 1 ${filePath}`);
        return headers.replace(/\n$/, '');
    }

    /**
     * The headers would be in the first file in the list, so we send in all
     * of the files and this function will add headers to the rest
     * @param fileList The list of files created
     * @private
     */
    private async addHeadersToFiles(fileList: string[]) {
        const headers = await this.getHeaders(fileList[0]);
        this.log(`Adding the following headers to ${fileList.length} files...`);
        this.log(``);
        this.log(headers);
        this.log();

        // Headers are already in the first file
        const remainingFiles = fileList.slice(1);
        const promax = Promax.create(os.cpus().length || 1, {
            throws: true,
        });

        // The first is already done
        let progress = 1;
        this.log(`Completed ${progress}/${fileList.length} files`);
        await promax
            .add(
                remainingFiles.map((remainingFile) => async () => {
                    await execute(`sed -i '1s/^/${headers}\\n/' "${remainingFile}"`);
                    this.log(`Completed ${++progress}/${fileList.length} files`);
                }),
            )
            .run();
        this.log('');
    }

    private async renameFiles(files: string[], originalFilePath: string) {
        const baseName = path.basename(originalFilePath);
        const ext = path.extname(originalFilePath);
        const blockName = removeExtension(baseName);
        const outputDirectory = path.dirname(files[0]);
        const maxDigits = this.calculateMaxDigits(files.length);
        let progress = 0;

        // We must run this sequentially
        for (const file of files) {
            await execute(`mv ${file} ${path.join(outputDirectory, `${blockName}_${progress.toString().padStart(maxDigits, '0')}${ext}`)}`);
            this.log(`Renamed ${++progress}/${files.length} files`);
        }

        this.log(``);
    }

    private calculateMaxDigits(files: number) {
        let maxDigits = 1;
        while (files / 10 > 1) {
            maxDigits++;
            files /= 10;
        }
        return maxDigits;
    }
}

export = TerminalCsvSplitter;
