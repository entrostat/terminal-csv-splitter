terminal-csv-splitter
=====================

A CSV splitter that uses inbuilt terminal commands.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/terminal-csv-splitter.svg)](https://npmjs.org/package/terminal-csv-splitter)
[![Downloads/week](https://img.shields.io/npm/dw/terminal-csv-splitter.svg)](https://npmjs.org/package/terminal-csv-splitter)
[![License](https://img.shields.io/npm/l/terminal-csv-splitter.svg)](https://github.com/Kerren-Entrostat/terminal-csv-splitter/blob/master/package.json)

# Introduction
This CLI splits files using `split`, `sed` and `mv`. It will only work on systems that have these binaries installed and accessible. By default, it creates a new folder in your current position with the name `/split-files` and stores the result there.

# Performance
I ran this over a file with over 35 million lines (35584137 to be exact) and I set lines to be 500000 per file. The process took a total of 22.297s to complete. Here are a few examples:

```
| Rows       | Time (s) |
|------------|----------|
| 35,584,137 | 22.297   |
| 33,660,564 | 20.327   |
| 1,858,407  | 0.348    |
```

In most cases, other CLIs that I used were not able to run on files of this size, so I don't have a benchmark against others (yet).

# Installation
You can install this CLI globally using:
```bash
npm install -g terminal-csv-splitter
```

Or you can use `npx` to run it without installing it.

## Binaries
Binaries are included on the releases page.

# Usage

The purpose of this package is to make it easy to split files into multiple ones (with or without headers). The file name and number of lines are required, the other flags can be left out. Some examples of usage include:
```sh-session
terminal-csv-splitter ./my_file.csv --lines=500000
terminal-csv-splitter ./my_file.csv --lines=500000 --out=./custom/output/folder
terminal-csv-splitter ./my_file.csv --lines=500000 --no-header
```

Using `npx` would look as follows:
```sh-session
npx terminal-csv-splitter ./my_file.csv --lines=500000
```

Running `terminal-csv-splitter --help` shows you the flags and their defaults:

```
Splits a file into multiple CSVs. You are required to have split, sed and mv installed for this to work!

USAGE
  $ terminal-csv-splitter [FILE] --lines=lines

OPTIONS
  -H, --no-header    If there is no header in the csv then set this to true
  -h, --help         show CLI help
  -l, --lines=lines  (required) The number of lines per file
  -o, --out=out      [default: ./split-files] The output directory
  -v, --version      show CLI version

EXAMPLES
  terminal-csv-splitter ./my_file.csv --lines=500000
  terminal-csv-splitter ./my_file.csv --lines=500000 --out=./custom/output/folder
  terminal-csv-splitter ./my_file.csv --lines=500000 --no-header
```
