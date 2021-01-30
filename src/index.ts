import { Command, flags } from '@oclif/command';
import * as path from 'path';
import { assertFileExists } from './assert-file-exists';
// @ts-ignore
import * as fs from 'fs-extra';
import { removeExtension } from './remove-extension';
import { v4 as uuid } from 'uuid';
import { execute } from './execute';
import { Promax } from 'promax';
import * as os from 'os';

class TerminalCsvSplitter extends Command {
    static description = 'Splits a file into multiple CSVs. You are required to have split, sed and mv installed for this to work!';

    static examples = [
        `terminal-csv-splitter ./my_file.csv --lines=500000`,
        `terminal-csv-splitter ./my_file.csv --lines=500000 --out=./custom/output/folder`,
        `terminal-csv-splitter ./my_file.csv --lines=500000 --no-header`,
    ];

    static flags = {
        version: flags.version({ char: 'v' }),
        help: flags.help({ char: 'h' }),
        lines: flags.integer({
            char: 'l',
            description: 'The number of lines per file',
            required: true,
        }),
        'no-header': flags.boolean({
            char: 'H',
            description: 'If there is no header in the csv then set this to true',
            default: false,
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
                flags['no-header'] ? 'headers are not enabled' : 'headers are enabled'
            }...`,
        );

        const { outputDirectory, outputPath, suffix } = await this.createOutputDirectory(flags.out);

        await this.splitFile(flags.lines, filePath, outputPath);

        const fileList = await this.getFileList(outputDirectory, suffix);

        this.log(`Split ${args.file} into ${fileList.length} files!`);

        if (!flags['no-header']) {
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

    /**
     * Makes the directory and creates a suffix to work with during this process
     * @param outputFlag The output directory specified by the user
     * @private
     */
    private async createOutputDirectory(outputFlag: string) {
        const outputDirectory = path.resolve(outputFlag);
        await fs.mkdirp(outputDirectory);
        const suffix = uuid().toString();
        const outputPath = path.join(outputDirectory, suffix);
        return { outputDirectory, outputPath, suffix };
    }

    /**
     * Splits the file into a certain number of lines
     * @param lines The number of lines
     * @param filePath The path to the file
     * @param outputPath The output path for all of the split files
     * @private
     */
    private async splitFile(lines: number, filePath: string, outputPath: string) {
        try {
            await execute(`split -l ${lines} ${filePath} ${outputPath}`);
        } catch (e) {
            this.error(e.message);
        }
    }

    /**
     * Returns a list of all of the files that were created during the split
     * process
     * @param outputDirectory The directory where the files are saved
     * @param suffix The special suffix created for this process
     * @private
     */
    private async getFileList(outputDirectory: string, suffix: string) {
        const allFileList = await fs.readdir(outputDirectory);

        const fileList = allFileList
            .filter((fileName) => fileName.indexOf(suffix) > -1)
            .sort()
            .map((fileName) => path.join(outputDirectory, fileName));

        return fileList;
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

    /**
     * Renames the files back to the original file name with a number counter
     * on it
     * @para files The files that were created during the split process
     * @param originalFilePath The original file name to use to rename these
     * files
     * @private
     */
    private async renameFiles(files: string[], originalFilePath: string) {
        const baseName = path.basename(originalFilePath);
        const ext = path.extname(originalFilePath);
        const blockName = removeExtension(baseName);
        const outputDirectory = path.dirname(files[0]);
        const maxDigits = this.calculateMaxDigits(files.length);
        let progress = 1;

        // We must run this sequentially
        for (const file of files) {
            await execute(`mv ${file} ${path.join(outputDirectory, `${blockName}_${progress.toString().padStart(maxDigits, '0')}${ext}`)}`);
            this.log(`Renamed ${progress++}/${files.length} files`);
        }

        this.log(``);
    }

    /**
     * Calculates how many digits each file should have as a suffix so that
     * they are all the same length. Ie, if there were 10 files, we need to do
     * 01
     * 02
     * 03
     * etc
     * @param files The number of files that were created
     * @private
     */
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
