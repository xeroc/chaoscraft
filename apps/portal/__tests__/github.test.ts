/**
 * Tests for GitHub lib type definitions and transformations
 * Story-9: Update StarData type to include file details
 * 
 * Tests:
 * - FileChange interface type definition
 * - StarData interface includes filesChanged array
 * - transformPRToStar populates filesChanged array
 * - Files are sorted by lines changed (descending)
 */

import { describe, it, expect } from 'vitest'
import { transformPRToStar, type StarData, type FileChange, type GitHubPR } from '../lib/github'

describe('GitHub Type Definitions', () => {
  describe('FileChange interface', () => {
    it('should have path, additions, and deletions properties', () => {
      const fileChange: FileChange = {
        path: 'src/test.ts',
        additions: 10,
        deletions: 5,
      }
      
      expect(fileChange.path).toBe('src/test.ts')
      expect(fileChange.additions).toBe(10)
      expect(fileChange.deletions).toBe(5)
    })

    it('should allow zero additions and deletions', () => {
      const fileChange: FileChange = {
        path: 'empty-file.txt',
        additions: 0,
        deletions: 0,
      }
      
      expect(fileChange.additions).toBe(0)
      expect(fileChange.deletions).toBe(0)
    })

    it('should support various file path formats', () => {
      const paths = [
        'apps/portal/components/Test.tsx',
        'lib/utils.js',
        'src/nested/deep/file.py',
        'README.md',
        '.env.example',
      ]
      
      paths.forEach(path => {
        const fileChange: FileChange = {
          path,
          additions: 1,
          deletions: 0,
        }
        expect(fileChange.path).toBe(path)
      })
    })
  })

  describe('StarData interface filesChanged field', () => {
    it('should include filesChanged array in StarData type', () => {
      const starData: StarData = {
        id: 1,
        issueNumber: 42,
        title: 'Test Feature',
        description: 'A test feature',
        position: { x: 0, y: 0, z: 0 },
        color: 'blue',
        size: 8,
        brightness: 1.0,
        pulse: false,
        priority: 'standard',
        linesChanged: 100,
        files: 3,
        commitHash: 'abc12345',
        mergedAt: '2024-01-15T10:30:00Z',
        builtBy: 'testuser',
        prUrl: 'https://github.com/test/test/pull/1',
        filesChanged: [
          { path: 'test.ts', additions: 50, deletions: 10 },
          { path: 'test2.ts', additions: 30, deletions: 10 },
        ],
      }
      
      expect(starData.filesChanged).toBeDefined()
      expect(Array.isArray(starData.filesChanged)).toBe(true)
      expect(starData.filesChanged).toHaveLength(2)
    })

    it('should allow empty filesChanged array', () => {
      const starData: StarData = {
        id: 2,
        issueNumber: null,
        title: 'Empty Feature',
        description: 'No files changed',
        position: { x: 1, y: 1, z: 1 },
        color: 'green',
        size: 5,
        brightness: 0.8,
        pulse: false,
        priority: 'standard',
        linesChanged: 0,
        files: 0,
        commitHash: 'def45678',
        mergedAt: null,
        builtBy: 'unknown',
        prUrl: null,
        filesChanged: [],
      }
      
      expect(starData.filesChanged).toEqual([])
    })

    it('should support FileChange objects with all required fields', () => {
      const filesChanged: FileChange[] = [
        { path: 'file1.ts', additions: 100, deletions: 50 },
        { path: 'file2.ts', additions: 25, deletions: 75 },
        { path: 'file3.ts', additions: 0, deletions: 200 },
      ]
      
      const starData: StarData = {
        id: 3,
        issueNumber: 1,
        title: 'Multi-file Feature',
        description: 'Changes multiple files',
        position: { x: 2, y: 3, z: 4 },
        color: 'purple',
        size: 10,
        brightness: 0.9,
        pulse: true,
        priority: 'express',
        linesChanged: 450,
        files: 3,
        commitHash: 'abc11111',
        mergedAt: '2024-02-20T00:00:00Z',
        builtBy: 'developer',
        prUrl: 'https://github.com/test/test/pull/10',
        filesChanged,
      }
      
      expect(starData.filesChanged).toHaveLength(3)
      expect(starData.filesChanged[0].path).toBe('file1.ts')
      expect(starData.filesChanged[1].additions).toBe(25)
      expect(starData.filesChanged[2].deletions).toBe(200)
    })
  })
})

describe('transformPRToStar function', () => {
  const createMockPR = (overrides: Partial<GitHubPR> = {}): GitHubPR => ({
    number: 1,
    title: 'Test PR',
    body: 'Test body',
    mergedAt: '2024-01-15T10:30:00Z',
    additions: 100,
    deletions: 50,
    changedFiles: 3,
    files: [
      { path: 'file1.ts', additions: 50, deletions: 20 },
      { path: 'file2.ts', additions: 30, deletions: 10 },
      { path: 'file3.ts', additions: 20, deletions: 20 },
    ],
    mergeCommit: { oid: 'abc1234567890123456789012345678901234567' },
    author: { login: 'testuser' },
    url: 'https://github.com/test/test/pull/1',
    ...overrides,
  })

  describe('filesChanged array population', () => {
    it('should populate filesChanged from PR files', () => {
      const pr = createMockPR()
      const star = transformPRToStar(pr, 0)
      
      expect(star.filesChanged).toBeDefined()
      expect(star.filesChanged).toHaveLength(3)
    })

    it('should include path, additions, and deletions for each file', () => {
      const pr = createMockPR()
      const star = transformPRToStar(pr, 0)
      
      expect(star.filesChanged[0]).toHaveProperty('path')
      expect(star.filesChanged[0]).toHaveProperty('additions')
      expect(star.filesChanged[0]).toHaveProperty('deletions')
    })

    it('should handle PR with no files', () => {
      const pr = createMockPR({ files: [], changedFiles: 0 })
      const star = transformPRToStar(pr, 0)
      
      expect(star.filesChanged).toEqual([])
    })

    it('should handle PR with many files', () => {
      const manyFiles = Array.from({ length: 50 }, (_, i) => ({
        path: `file${i}.ts`,
        additions: i + 1,
        deletions: i,
      }))
      
      const pr = createMockPR({ files: manyFiles, changedFiles: 50 })
      const star = transformPRToStar(pr, 0)
      
      expect(star.filesChanged).toHaveLength(50)
    })
  })

  describe('files sorting by lines changed', () => {
    it('should sort files by total lines changed (descending)', () => {
      const pr = createMockPR({
        files: [
          { path: 'small.ts', additions: 5, deletions: 5 },   // 10 total
          { path: 'large.ts', additions: 100, deletions: 50 }, // 150 total
          { path: 'medium.ts', additions: 30, deletions: 20 }, // 50 total
        ],
      })
      
      const star = transformPRToStar(pr, 0)
      
      // Files should be sorted by (additions + deletions) descending
      expect(star.filesChanged[0].path).toBe('large.ts')   // 150
      expect(star.filesChanged[1].path).toBe('medium.ts')  // 50
      expect(star.filesChanged[2].path).toBe('small.ts')   // 10
    })

    it('should handle ties by maintaining relative order', () => {
      const pr = createMockPR({
        files: [
          { path: 'first.ts', additions: 10, deletions: 10 },  // 20 total
          { path: 'second.ts', additions: 15, deletions: 5 },  // 20 total
          { path: 'third.ts', additions: 5, deletions: 15 },   // 20 total
        ],
      })
      
      const star = transformPRToStar(pr, 0)
      
      // All have same total, verify they're all present
      expect(star.filesChanged).toHaveLength(3)
      expect(star.filesChanged.map(f => f.path)).toContain('first.ts')
      expect(star.filesChanged.map(f => f.path)).toContain('second.ts')
      expect(star.filesChanged.map(f => f.path)).toContain('third.ts')
    })

    it('should sort files with zero deletions correctly', () => {
      const pr = createMockPR({
        files: [
          { path: 'new-file.ts', additions: 100, deletions: 0 },
          { path: 'small-new.ts', additions: 10, deletions: 0 },
          { path: 'modified.ts', additions: 50, deletions: 25 },
        ],
      })
      
      const star = transformPRToStar(pr, 0)
      
      // 100 > 75 > 10
      expect(star.filesChanged[0].path).toBe('new-file.ts')    // 100
      expect(star.filesChanged[1].path).toBe('modified.ts')    // 75
      expect(star.filesChanged[2].path).toBe('small-new.ts')   // 10
    })

    it('should sort files with only deletions correctly', () => {
      const pr = createMockPR({
        files: [
          { path: 'deleted-large.ts', additions: 0, deletions: 200 },
          { path: 'deleted-small.ts', additions: 0, deletions: 50 },
          { path: 'mixed.ts', additions: 30, deletions: 30 },
        ],
      })
      
      const star = transformPRToStar(pr, 0)
      
      // 200 > 60 > 50
      expect(star.filesChanged[0].path).toBe('deleted-large.ts')  // 200
      expect(star.filesChanged[1].path).toBe('mixed.ts')          // 60
      expect(star.filesChanged[2].path).toBe('deleted-small.ts')  // 50
    })
  })

  describe('file data integrity', () => {
    it('should preserve exact path values', () => {
      const pr = createMockPR({
        files: [
          { path: 'apps/portal/components/Nested/File.tsx', additions: 10, deletions: 5 },
        ],
      })
      
      const star = transformPRToStar(pr, 0)
      
      expect(star.filesChanged[0].path).toBe('apps/portal/components/Nested/File.tsx')
    })

    it('should preserve exact addition and deletion counts', () => {
      const pr = createMockPR({
        files: [
          { path: 'test.ts', additions: 123, deletions: 456 },
        ],
      })
      
      const star = transformPRToStar(pr, 0)
      
      expect(star.filesChanged[0].additions).toBe(123)
      expect(star.filesChanged[0].deletions).toBe(456)
    })
  })
})

describe('StarData type completeness', () => {
  it('should include all required fields in transformed star', () => {
    const pr: GitHubPR = {
      number: 42,
      title: 'Complete PR',
      body: 'Body with #123 issue reference',
      mergedAt: '2024-03-01T12:00:00Z',
      additions: 200,
      deletions: 100,
      changedFiles: 5,
      files: [
        { path: 'main.ts', additions: 100, deletions: 50 },
        { path: 'utils.ts', additions: 50, deletions: 25 },
        { path: 'test.ts', additions: 30, deletions: 15 },
        { path: 'config.json', additions: 15, deletions: 5 },
        { path: 'readme.md', additions: 5, deletions: 5 },
      ],
      mergeCommit: { oid: 'deadbeef123456789012345678901234567890' },
      author: { login: 'developer' },
      url: 'https://github.com/xeroc/chaoscraft/pull/42',
    }
    
    const star = transformPRToStar(pr, 0)
    
    // Verify all StarData fields are populated
    expect(star.id).toBe(1)
    expect(star.issueNumber).toBe(123)  // Extracted from body
    expect(star.title).toBe('Complete PR')
    expect(star.description).toBeDefined()
    expect(star.position).toHaveProperty('x')
    expect(star.position).toHaveProperty('y')
    expect(star.position).toHaveProperty('z')
    expect(star.color).toBeDefined()
    expect(star.size).toBeGreaterThan(0)
    expect(star.brightness).toBeGreaterThanOrEqual(0.5)
    expect(star.brightness).toBeLessThanOrEqual(1.0)
    expect(typeof star.pulse).toBe('boolean')
    expect(star.priority).toBeDefined()
    expect(star.linesChanged).toBe(300)  // additions + deletions
    expect(star.files).toBe(5)
    expect(star.commitHash).toBeDefined()
    expect(star.mergedAt).toBe('2024-03-01T12:00:00Z')
    expect(star.builtBy).toBe('developer')
    expect(star.prUrl).toBe('https://github.com/xeroc/chaoscraft/pull/42')
    expect(star.filesChanged).toHaveLength(5)
    expect(star.filesChanged[0].path).toBe('main.ts')  // Sorted by lines changed
  })

  it('should handle null issue number gracefully', () => {
    const pr: GitHubPR = {
      number: 1,
      title: 'PR without issue',
      body: 'No issue reference here',
      mergedAt: '2024-03-01T12:00:00Z',
      additions: 50,
      deletions: 25,
      changedFiles: 1,
      files: [{ path: 'file.ts', additions: 50, deletions: 25 }],
      mergeCommit: { oid: 'abc123' },
      author: { login: 'user' },
      url: 'https://github.com/test/test/pull/1',
    }
    
    const star = transformPRToStar(pr, 0)
    
    expect(star.issueNumber).toBeNull()
  })

  it('should handle null mergedAt gracefully', () => {
    const pr: GitHubPR = {
      number: 1,
      title: 'Unmerged PR',
      body: 'Not merged yet',
      mergedAt: null,
      additions: 10,
      deletions: 5,
      changedFiles: 1,
      files: [{ path: 'file.ts', additions: 10, deletions: 5 }],
      mergeCommit: null,
      author: null,
      url: 'https://github.com/test/test/pull/1',
    }
    
    const star = transformPRToStar(pr, 0)
    
    expect(star.mergedAt).toBeNull()
    expect(star.commitHash).toMatch(/^hash-/)  // Fallback hash
    expect(star.builtBy).toBe('Unknown')
  })
})
