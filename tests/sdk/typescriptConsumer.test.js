import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const ROOT_DIR = process.cwd();
const WINDOWS_SHELL = process.env.ComSpec || 'cmd.exe';

function run(command, args, cwd) {
    const result = spawnSync(
        process.platform === 'win32' && command === 'pnpm' ? WINDOWS_SHELL : command,
        process.platform === 'win32' && command === 'pnpm'
            ? ['/d', '/s', '/c', command, ...args]
            : args,
        {
            cwd,
            encoding: 'utf8'
        }
    );

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0) {
        const details = [result.stdout, result.stderr]
            .filter(Boolean)
            .join('\n')
            .trim();
        throw new Error(details || `${command} failed`);
    }

    return result;
}

test('packed sdk should compile in an isolated TypeScript consumer without DOM libs', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'wm-ts-consumer-'));
    const nodeModulesDir = path.join(tempDir, 'node_modules');
    const packageRoot = path.join(nodeModulesDir, 'gemini-watermark-remover');
    const tarballDir = path.join(tempDir, 'packed');
    const tsconfigPath = path.join(tempDir, 'tsconfig.json');
    const consumerEntry = path.join(tempDir, 'consumer.ts');
    const exampleDir = path.join(ROOT_DIR, 'examples', 'sdk-consumer-ts');

    await mkdir(packageRoot, { recursive: true });
    await mkdir(tarballDir, { recursive: true });

    run('pnpm', ['pack', '--pack-destination', tarballDir], ROOT_DIR);

    const packedFiles = await readdir(tarballDir);
    assert.equal(packedFiles.length, 1, `expected exactly one tarball, got ${packedFiles.join(', ')}`);

    const tarballPath = path.join(tarballDir, packedFiles[0]);
    run('tar', ['-xf', tarballPath, '-C', packageRoot, '--strip-components=1'], ROOT_DIR);

    const exampleTsconfig = JSON.parse(await readFile(path.join(exampleDir, 'tsconfig.json'), 'utf8'));
    exampleTsconfig.compilerOptions.typeRoots = [path.join(ROOT_DIR, 'node_modules', '@types')];
    await writeFile(tsconfigPath, JSON.stringify(exampleTsconfig, null, 2), 'utf8');

    await writeFile(consumerEntry, await readFile(path.join(exampleDir, 'consumer.ts'), 'utf8'), 'utf8');

    const examplePackageJson = JSON.parse(await readFile(path.join(exampleDir, 'package.json'), 'utf8'));
    await writeFile(path.join(tempDir, 'package.json'), JSON.stringify({
        ...examplePackageJson,
        dependencies: {
            ...examplePackageJson.dependencies,
            'gemini-watermark-remover': 'file:./node_modules/gemini-watermark-remover'
        }
    }, null, 2), 'utf8');

    run('pnpm', ['exec', 'tsc', '--project', tsconfigPath, '--pretty', 'false'], ROOT_DIR);
});
