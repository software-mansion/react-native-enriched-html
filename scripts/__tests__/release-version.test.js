'use strict';

const { resolveReleaseVersion } = require('../release-version');

const manifestVersion = '1.0.0';
const gitSha = 'abcdef1234567890';
const now = new Date('2026-08-07T12:00:00Z');

function resolve(overrides) {
  return resolveReleaseVersion({
    baseVersion: '',
    distTags: {},
    gitSha,
    manifestVersion,
    now,
    publishedVersions: [],
    releaseType: 'stable',
    ...overrides,
  });
}

describe('resolveReleaseVersion', () => {
  test('publishes the first manifest version as latest', () => {
    expect(resolve()).toEqual({
      removeTagAfterPublish: false,
      tag: 'latest',
      version: '1.0.0',
    });
  });

  test('keeps latest unchanged for a maintenance release', () => {
    expect(
      resolve({
        distTags: { latest: '2.0.0' },
        manifestVersion: '1.0.1',
        publishedVersions: ['1.0.0', '2.0.0'],
      })
    ).toEqual({
      removeTagAfterPublish: true,
      tag: 'legacy',
      version: '1.0.1',
    });
  });

  test('rejects an existing stable version', () => {
    expect(() => resolve({ publishedVersions: ['1.0.0'] })).toThrow(
      '1.0.0 is already published'
    );
  });

  test.each(['beta', 'rc'])('increments %s prereleases', (releaseType) => {
    expect(
      resolve({
        baseVersion: '1.1.0',
        publishedVersions: [`1.1.0-${releaseType}.1`, `1.1.0-${releaseType}.3`],
        releaseType,
      })
    ).toEqual({
      removeTagAfterPublish: false,
      tag: 'next',
      version: `1.1.0-${releaseType}.4`,
    });
  });

  test('bases nightlies on the next minor after latest', () => {
    expect(
      resolve({
        distTags: { latest: '1.2.3' },
        releaseType: 'nightly',
      })
    ).toEqual({
      removeTagAfterPublish: false,
      tag: 'nightly',
      version: '1.3.0-nightly-20260807-abcdef123',
    });
  });

  test('uses the manifest for the first nightly publication', () => {
    expect(resolve({ releaseType: 'nightly' }).version).toBe(
      '1.0.0-nightly-20260807-abcdef123'
    );
  });

  test('uses an explicit nightly base version', () => {
    expect(
      resolve({ baseVersion: '3.0.0', releaseType: 'nightly' }).version
    ).toBe('3.0.0-nightly-20260807-abcdef123');
  });

  test('rejects a duplicate nightly commit for the same base', () => {
    expect(() =>
      resolve({
        baseVersion: '2.0.0',
        publishedVersions: ['2.0.0-nightly-20260806-abcdef123'],
        releaseType: 'nightly',
      })
    ).toThrow('Commit abcdef123 is already published for 2.0.0');
  });

  test('rejects prerelease manifest versions for stable releases', () => {
    expect(() => resolve({ manifestVersion: '1.0.0-rc.1' })).toThrow(
      'package.json version must use the stable x.y.z format'
    );
  });

  test('rejects a base-version override for stable releases', () => {
    expect(() => resolve({ baseVersion: '2.0.0' })).toThrow(
      'Stable releases must use the version in package.json'
    );
  });

  test('rejects unsupported release types', () => {
    expect(() => resolve({ releaseType: 'alpha' })).toThrow(
      'Unsupported release type: alpha'
    );
  });
});
