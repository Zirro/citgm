// FIXME not really a unit test
// FIXME npm should be stubbed
// TODO Test for local module... what does it even mean?

import * as path from 'path';
import { fileURLToPath } from 'url';
import * as os from 'os';
import { promisify } from 'util';

import fse from 'fs-extra';
import tap from 'tap';
import mkdirpLib from 'mkdirp';
import rimrafLib from 'rimraf';

import { grabProject } from '../lib/grab-project.js';

const { test } = tap;
const mkdirp = promisify(mkdirpLib);
const rimraf = promisify(rimrafLib);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sandbox = path.join(os.tmpdir(), `citgm-${Date.now()}`);
const fixtures = path.join(__dirname, 'fixtures');

test('grab-project: setup', async () => {
  await mkdirp(sandbox);
});

test('grab-project: npm module', async (t) => {
  t.plan(1);
  const context = {
    emit: function() {},
    path: sandbox,
    module: {
      raw: 'omg-i-pass'
    },
    meta: {},
    options: {}
  };
  await grabProject(context);
  const stats = await fse.stat(context.unpack);
  t.ok(stats.isFile(), 'The tar ball should exist on the system');
});

test('grab-project: local', async (t) => {
  t.plan(1);
  const context = {
    emit: function() {},
    path: sandbox,
    module: {
      raw: './test/fixtures/omg-i-pass',
      type: 'directory'
    },
    meta: {},
    options: {}
  };
  await grabProject(context);
  const stats = await fse.stat(context.unpack);
  t.ok(stats.isFile(), 'The tar ball should exist on the system');
});

test('grab-project: lookup table', async (t) => {
  t.plan(1);
  const context = {
    emit: function() {},
    path: sandbox,
    module: {
      raw: 'lodash'
    },
    meta: {},
    options: {}
  };
  await grabProject(context);
  const stats = await fse.stat(context.unpack);
  t.ok(stats.isFile(), 'The tar ball should exist on the system');
});

test('grab-project: local', async (t) => {
  t.plan(1);
  const context = {
    emit: function() {},
    path: sandbox,
    module: {
      raw: 'omg-i-pass',
      type: 'directory'
    },
    options: {}
  };
  process.chdir(fixtures);
  await grabProject(context);
  const stats = await fse.stat(context.unpack);
  t.ok(stats.isFile(), 'The tar ball should exist on the system');
  process.chdir(__dirname);
});

test('grab-project: module does not exist', async (t) => {
  t.plan(1);
  const context = {
    emit: function() {},
    path: sandbox,
    module: {
      raw: 'I-DO-NOT-EXIST'
    },
    options: {}
  };
  try {
    await grabProject(context);
  } catch (err) {
    t.equals(err && err.message, 'Failure getting project from npm');
  }
});

test('grab-project: use git clone', async (t) => {
  t.plan(1);
  const context = {
    emit: function() {},
    path: path.join(sandbox, 'git-clone'),
    module: {
      useGitClone: true,
      name: 'omg-i-pass',
      raw: 'https://github.com/MylesBorins/omg-i-pass.git',
      ref: 'v3.0.0'
    },
    options: {}
  };
  await grabProject(context);
  const stats = await fse.stat(
    path.join(context.path, 'omg-i-pass/package.json')
  );
  t.ok(stats.isFile(), 'The project must be cloned locally');
});

test('grab-project: fail with bad ref', async (t) => {
  t.plan(1);
  const context = {
    emit: function() {},
    path: path.join(sandbox, 'git-bad-ref'),
    module: {
      useGitClone: true,
      name: 'omg-i-pass',
      raw: 'https://github.com/MylesBorins/omg-i-pass.git',
      ref: 'bad-git-ref'
    },
    options: {}
  };
  try {
    await grabProject(context);
  } catch (err) {
    t.match(
      err.message,
      /^Command failed: git fetch --depth=1 origin bad-git-ref/
    );
  }
});

test('grab-project: timeout', async (t) => {
  t.plan(1);
  const context = {
    emit: function() {},
    path: sandbox,
    module: {
      name: 'omg-i-pass'
    },
    meta: {},
    options: {
      npmLevel: 'silly',
      timeoutLength: 10
    }
  };
  try {
    await grabProject(context);
  } catch (err) {
    t.equals(err && err.message, 'Download Timed Out');
  }
});

test('grab-project: teardown', async () => {
  await rimraf(sandbox);
});
