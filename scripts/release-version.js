'use strict';

const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

const RELEASE_TYPES = new Set(['stable', 'beta', 'rc', 'nightly']);
const STABLE_VERSION_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/;

function parseStableVersion(value, label = 'version') {
  const match = STABLE_VERSION_PATTERN.exec(value);
  if (!match) {
    throw new Error(`${label} must use the stable x.y.z format: ${value}`);
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    value,
  };
}

function compareStableVersions(left, right) {
  for (const key of ['major', 'minor', 'patch']) {
    if (left[key] !== right[key]) {
      return left[key] - right[key];
    }
  }

  return 0;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatUtcDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function resolveReleaseVersion({
  releaseType,
  manifestVersion,
  baseVersion = '',
  publishedVersions = [],
  distTags = {},
  gitSha,
  now = new Date(),
}) {
  if (!RELEASE_TYPES.has(releaseType)) {
    throw new Error(`Unsupported release type: ${releaseType}`);
  }

  const published = new Set(publishedVersions);

  if (releaseType === 'stable') {
    if (baseVersion) {
      throw new Error('Stable releases must use the version in package.json');
    }

    const version = parseStableVersion(manifestVersion, 'package.json version');
    if (published.has(version.value)) {
      throw new Error(`${version.value} is already published`);
    }

    const latest = distTags.latest
      ? parseStableVersion(distTags.latest, 'latest dist-tag')
      : null;
    const tag =
      !latest || compareStableVersions(version, latest) > 0
        ? 'latest'
        : 'legacy';

    return {
      removeTagAfterPublish: tag === 'legacy',
      tag,
      version: version.value,
    };
  }

  if (releaseType === 'beta' || releaseType === 'rc') {
    const base = parseStableVersion(
      baseVersion || manifestVersion,
      'prerelease base version'
    ).value;
    const pattern = new RegExp(
      `^${escapeRegExp(base)}-${releaseType}\\.(\\d+)$`
    );
    const indices = publishedVersions
      .map((version) => pattern.exec(version))
      .filter(Boolean)
      .map((match) => Number(match[1]));
    const nextIndex = indices.length === 0 ? 1 : Math.max(...indices) + 1;

    return {
      removeTagAfterPublish: false,
      tag: 'next',
      version: `${base}-${releaseType}.${nextIndex}`,
    };
  }

  let base;
  if (baseVersion) {
    base = parseStableVersion(baseVersion, 'nightly base version').value;
  } else if (distTags.latest) {
    const latest = parseStableVersion(distTags.latest, 'latest dist-tag');
    base = `${latest.major}.${latest.minor + 1}.0`;
  } else {
    base = parseStableVersion(manifestVersion, 'package.json version').value;
  }

  if (!/^[0-9a-f]{9,40}$/i.test(gitSha)) {
    throw new Error(`Invalid git SHA: ${gitSha}`);
  }

  const shortSha = gitSha.slice(0, 9).toLowerCase();
  const duplicatePattern = new RegExp(
    `^${escapeRegExp(base)}-nightly-\\d{8}-${shortSha}$`
  );
  if (publishedVersions.some((version) => duplicatePattern.test(version))) {
    throw new Error(`Commit ${shortSha} is already published for ${base}`);
  }

  return {
    removeTagAfterPublish: false,
    tag: 'nightly',
    version: `${base}-nightly-${formatUtcDate(now)}-${shortSha}`,
  };
}

function isNotFoundError(error) {
  const output = [error.message, error.stdout, error.stderr]
    .filter(Boolean)
    .map(String)
    .join('\n');
  return output.includes('E404') || output.includes('404 Not Found');
}

function npmView(packageName, field, registry) {
  try {
    const output = execFileSync(
      'npm',
      ['view', packageName, field, '--json', `--registry=${registry}`],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
    ).trim();
    return output ? JSON.parse(output) : null;
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }
    throw error;
  }
}

function readRegistryState(packageName, registry) {
  const rawVersions = npmView(packageName, 'versions', registry);
  const publishedVersions = rawVersions
    ? Array.isArray(rawVersions)
      ? rawVersions
      : [rawVersions]
    : [];

  return {
    distTags: npmView(packageName, 'dist-tags', registry) || {},
    publishedVersions,
  };
}

function parseArguments(argv) {
  const options = {
    baseVersion: '',
    packageJsonPath: 'package.json',
    registry: 'https://npm.pkg.github.com',
  };

  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || value === undefined) {
      throw new Error(`Invalid argument: ${key || '<empty>'}`);
    }

    if (key === '--release-type') options.releaseType = value;
    else if (key === '--base-version') options.baseVersion = value;
    else if (key === '--package-json') options.packageJsonPath = value;
    else if (key === '--registry') options.registry = value;
    else throw new Error(`Unknown argument: ${key}`);
  }

  if (!options.releaseType) {
    throw new Error('--release-type is required');
  }

  return options;
}

function run(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  const packageJson = JSON.parse(
    fs.readFileSync(options.packageJsonPath, 'utf8')
  );
  const registryState = readRegistryState(packageJson.name, options.registry);
  const gitSha = execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim();
  const result = resolveReleaseVersion({
    ...registryState,
    baseVersion: options.baseVersion,
    gitSha,
    manifestVersion: packageJson.version,
    releaseType: options.releaseType,
  });

  if (packageJson.version !== result.version) {
    packageJson.version = result.version;
    fs.writeFileSync(
      options.packageJsonPath,
      `${JSON.stringify(packageJson, null, 2)}\n`
    );
  }

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `version=${result.version}\ntag=${result.tag}\nremove-tag=${result.removeTagAfterPublish}\n`
    );
  }

  console.log(
    `Resolved ${options.releaseType} release ${result.version} with dist-tag ${result.tag}`
  );
  return result;
}

if (require.main === module) {
  try {
    run();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  compareStableVersions,
  formatUtcDate,
  parseStableVersion,
  resolveReleaseVersion,
};
