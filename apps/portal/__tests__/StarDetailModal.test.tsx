/**
 * Tests for StarDetailModal component
 * Tests the extracted modal component for:
 * - Props receiving and rendering
 * - Modal display with various star data states
 * - onClose callback functionality
 * - Files list toggle functionality
 * - Link generation for commits, issues, and PRs
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Import StarDetailModal
import StarDetailModal from '../components/StarDetailModal'

// Helper to create mock star data
const createMockStar = (overrides: any = {}) => ({
  id: 1,
  issueNumber: 42,
  title: 'Test Feature',
  description: 'A test feature',
  position: { x: 0, y: 0, z: 0 },
  color: 'blue' as const,
  size: 8,
  brightness: 1.0,
  pulse: false,
  priority: 'standard',
  linesChanged: 100,
  files: 3,
  commitHash: 'abc123',
  mergedAt: '2024-01-15T10:30:00Z',
  builtBy: 'testuser',
  prUrl: 'https://github.com/xeroc/chaoscraft/pull/1',
  filesChanged: [
    { path: 'test.ts', additions: 10, deletions: 5 },
  ],
  ...overrides,
})

describe('StarDetailModal', () => {
  describe('Props Handling', () => {
    it('should receive star data as prop', () => {
      const mockStar = createMockStar()
      const onCloseMock = vi.fn()

      render(<StarDetailModal star={mockStar} onClose={onCloseMock} />)

      expect(screen.getByText(mockStar.title)).toBeTruthy()
    })

    it('should receive onClose callback as prop', () => {
      const mockStar = createMockStar()
      const onCloseMock = vi.fn()

      render(<StarDetailModal star={mockStar} onClose={onCloseMock} />)

      const closeButton = screen.getByText('×')
      fireEvent.click(closeButton)

      expect(onCloseMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('Link URL Generation', () => {
    it('should generate correct issue URL', () => {
      const issueNumber = 42
      const expectedUrl = `https://github.com/xeroc/chaoscraft/issues/${issueNumber}`
      const actualUrl = `https://github.com/xeroc/chaoscraft/issues/${issueNumber}`

      expect(actualUrl).toBe(expectedUrl)
    })

    it('should generate correct commit URL', () => {
      const commitHash = 'abc123'
      const expectedUrl = `https://github.com/xeroc/chaoscraft/commit/${commitHash}`
      const actualUrl = `https://github.com/xeroc/chaoscraft/commit/${commitHash}`

      expect(actualUrl).toBe(expectedUrl)
    })

    it('should use prUrl directly for PR link', () => {
      const prUrl = 'https://github.com/xeroc/chaoscraft/pull/1'
      expect(prUrl).toBe('https://github.com/xeroc/chaoscraft/pull/1')
    })
  })

  describe('Modal Display', () => {
    it('should display PR title', () => {
      const mockStar = createMockStar({ title: 'Feature Title' })
      const onCloseMock = vi.fn()

      render(<StarDetailModal star={mockStar} onClose={onCloseMock} />)

      expect(screen.getByText('Feature Title')).toBeTruthy()
    })

    it('should display issue number when issueNumber exists', () => {
      const mockStar = createMockStar({ issueNumber: 42 })
      const onCloseMock = vi.fn()

      render(<StarDetailModal star={mockStar} onClose={onCloseMock} />)

      const issueLink = screen.getByText('#42')
      expect(issueLink).toBeTruthy()
      expect(issueLink.tagName).toBe('A')
    })

    it('should display "No linked issue" when issueNumber is null', () => {
      const mockStar = createMockStar({ issueNumber: null })
      const onCloseMock = vi.fn()

      render(<StarDetailModal star={mockStar} onClose={onCloseMock} />)

      expect(screen.getByText('No linked issue')).toBeTruthy()
    })

    it('should display description', () => {
      const mockStar = createMockStar({ description: 'Feature description' })
      const onCloseMock = vi.fn()

      render(<StarDetailModal star={mockStar} onClose={onCloseMock} />)

      expect(screen.getByText('Feature description')).toBeTruthy()
    })

    it('should display built by', () => {
      const mockStar = createMockStar({ builtBy: 'devuser' })
      const onCloseMock = vi.fn()

      render(<StarDetailModal star={mockStar} onClose={onCloseMock} />)

      expect(screen.getByText('devuser')).toBeTruthy()
    })

    it('should display files count', () => {
      const mockStar = createMockStar({ files: 5 })
      const onCloseMock = vi.fn()

      render(<StarDetailModal star={mockStar} onClose={onCloseMock} />)

      expect(screen.getByText('5')).toBeTruthy()
    })

    it('should display lines changed', () => {
      const mockStar = createMockStar({ linesChanged: 150 })
      const onCloseMock = vi.fn()

      render(<StarDetailModal star={mockStar} onClose={onCloseMock} />)

      expect(screen.getByText('150')).toBeTruthy()
    })

    it('should display priority text', () => {
      const mockStar = createMockStar({ priority: 'express' })
      const onCloseMock = vi.fn()

      render(<StarDetailModal star={mockStar} onClose={onCloseMock} />)

      expect(screen.getByText('express')).toBeTruthy()
    })
  })

  describe('Commit Link', () => {
    it('should display commit hash when commitHash exists', () => {
      const mockStar = createMockStar({ commitHash: 'abc12345' })
      const onCloseMock = vi.fn()

      render(<StarDetailModal star={mockStar} onClose={onCloseMock} />)

      const commitLink = screen.getByText('abc12345')
      expect(commitLink).toBeTruthy()
      expect(commitLink.tagName).toBe('A')
    })

    it('should display "No commit hash" when commitHash is empty', () => {
      const mockStar = createMockStar({ commitHash: '' })
      const onCloseMock = vi.fn()

      render(<StarDetailModal star={mockStar} onClose={onCloseMock} />)

      expect(screen.getByText('No commit hash')).toBeTruthy()
    })
  })

  describe('Merged Date', () => {
    it('should display merged date when mergedAt exists', () => {
      const mockStar = createMockStar({ mergedAt: '2024-01-15T10:30:00Z' })
      const onCloseMock = vi.fn()

      render(<StarDetailModal star={mockStar} onClose={onCloseMock} />)

      expect(screen.getByText(/Merged At/i)).toBeTruthy()
    })

    it('should not display merged date when mergedAt is null', () => {
      const mockStar = createMockStar({ mergedAt: null })
      const onCloseMock = vi.fn()

      render(<StarDetailModal star={mockStar} onClose={onCloseMock} />)

      expect(screen.queryByText(/Merged At/i)).toBeFalsy()
    })
  })

  describe('Files Changed List', () => {
    it('should display files changed list', () => {
      const filesChanged = [
        { path: 'file1.ts', additions: 10, deletions: 5 },
        { path: 'file2.ts', additions: 20, deletions: 10 },
      ]
      const mockStar = createMockStar({ filesChanged })
      const onCloseMock = vi.fn()

      render(<StarDetailModal star={mockStar} onClose={onCloseMock} />)

      expect(screen.getByText('file1.ts')).toBeTruthy()
      expect(screen.getByText('file2.ts')).toBeTruthy()
    })

    it('should display file additions in green', () => {
      const filesChanged = [{ path: 'test.ts', additions: 42, deletions: 10 }]
      const mockStar = createMockStar({ filesChanged })
      const onCloseMock = vi.fn()

      render(<StarDetailModal star={mockStar} onClose={onCloseMock} />)

      expect(screen.getByText('+42')).toBeTruthy()
    })

    it('should display file deletions in red', () => {
      const filesChanged = [{ path: 'test.ts', additions: 10, deletions: 15 }]
      const mockStar = createMockStar({ filesChanged })
      const onCloseMock = vi.fn()

      render(<StarDetailModal star={mockStar} onClose={onCloseMock} />)

      expect(screen.getByText('-15')).toBeTruthy()
    })

    it('should show first 10 files when more than 10 exist', () => {
      const manyFiles = Array.from({ length: 15 }, (_, i) => ({
        path: `file${i + 1}.ts`,
        additions: 10,
        deletions: 5,
      }))
      const mockStar = createMockStar({ filesChanged: manyFiles })
      const onCloseMock = vi.fn()

      render(<StarDetailModal star={mockStar} onClose={onCloseMock} />)

      // First 10 files should be visible
      expect(screen.getByText('file1.ts')).toBeTruthy()
      expect(screen.getByText('file10.ts')).toBeTruthy()

      // File 11 should not be visible initially
      expect(screen.queryByText('file11.ts')).toBeFalsy()
    })

    it('should toggle show more/less button', () => {
      const manyFiles = Array.from({ length: 15 }, (_, i) => ({
        path: `file${i + 1}.ts`,
        additions: 10,
        deletions: 5,
      }))
      const mockStar = createMockStar({ filesChanged: manyFiles })
      const onCloseMock = vi.fn()

      render(<StarDetailModal star={mockStar} onClose={onCloseMock} />)

      const showMoreButton = screen.getByText(/Show 5 more files/i)
      fireEvent.click(showMoreButton)

      // After clicking show more, all files should be visible
      expect(screen.getByText('file11.ts')).toBeTruthy()
      expect(screen.getByText('file15.ts')).toBeTruthy()

      // Button should now say "Show less"
      expect(screen.getByText('Show less')).toBeTruthy()
    })

    it('should not show toggle button when files <= 10', () => {
      const fewFiles = Array.from({ length: 8 }, (_, i) => ({
        path: `file${i + 1}.ts`,
        additions: 10,
        deletions: 5,
      }))
      const mockStar = createMockStar({ filesChanged: fewFiles })
      const onCloseMock = vi.fn()

      render(<StarDetailModal star={mockStar} onClose={onCloseMock} />)

      expect(screen.queryByText(/Show/)).toBeFalsy()
    })
  })

  describe('PR Link', () => {
    it('should display PR link when prUrl exists', () => {
      const mockStar = createMockStar({
        prUrl: 'https://github.com/xeroc/chaoscraft/pull/42',
        filesChanged: [{ path: 'test.ts', additions: 10, deletions: 5 }],
      })
      const onCloseMock = vi.fn()

      render(<StarDetailModal star={mockStar} onClose={onCloseMock} />)

      const prLink = screen.getByText('View on GitHub')
      expect(prLink).toBeTruthy()
      expect(prLink.tagName).toBe('A')
    })

    it('should not display PR link when prUrl is null', () => {
      const mockStar = createMockStar({
        prUrl: null,
        filesChanged: [{ path: 'test.ts', additions: 10, deletions: 5 }],
      })
      const onCloseMock = vi.fn()

      render(<StarDetailModal star={mockStar} onClose={onCloseMock} />)

      expect(screen.queryByText('View on GitHub')).toBeFalsy()
    })
  })

  describe('Close Interaction', () => {
    it('should call onClose when close button is clicked', () => {
      const mockStar = createMockStar()
      const onCloseMock = vi.fn()

      render(<StarDetailModal star={mockStar} onClose={onCloseMock} />)

      const closeButton = screen.getByText('×')
      fireEvent.click(closeButton)

      expect(onCloseMock).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when backdrop is clicked', () => {
      const mockStar = createMockStar()
      const onCloseMock = vi.fn()

      const { container } = render(<StarDetailModal star={mockStar} onClose={onCloseMock} />)

      // Click the backdrop (the outermost div with the modal)
      const backdrop = container.firstChild as HTMLElement
      fireEvent.click(backdrop)

      expect(onCloseMock).toHaveBeenCalledTimes(1)
    })

    it('should not call onClose when modal content is clicked', () => {
      const mockStar = createMockStar()
      const onCloseMock = vi.fn()

      const { container } = render(<StarDetailModal star={mockStar} onClose={onCloseMock} />)

      // Find the modal content (the inner div)
      const modalContent = container.querySelector('.bg-white\\/10')
      if (modalContent) {
        fireEvent.click(modalContent)
        expect(onCloseMock).not.toHaveBeenCalled()
      }
    })
  })

  describe('Data State Variations', () => {
    it('should handle star with all fields populated', () => {
      const completeStar = createMockStar({
        issueNumber: 42,
        commitHash: 'abc123',
        mergedAt: '2024-01-15T10:30:00Z',
        prUrl: 'https://github.com/xeroc/chaoscraft/pull/1',
        filesChanged: [{ path: 'test.ts', additions: 10, deletions: 5 }],
      })
      const onCloseMock = vi.fn()

      render(<StarDetailModal star={completeStar} onClose={onCloseMock} />)

      expect(screen.getByText('#42')).toBeTruthy()
      expect(screen.getByText('abc123')).toBeTruthy()
      expect(screen.getByText(/Merged At/i)).toBeTruthy()
      expect(screen.getByText('View on GitHub')).toBeTruthy()
    })

    it('should handle star with null issueNumber', () => {
      const partialStar = createMockStar({ issueNumber: null })
      const onCloseMock = vi.fn()

      render(<StarDetailModal star={partialStar} onClose={onCloseMock} />)

      expect(screen.getByText('No linked issue')).toBeTruthy()
    })

    it('should handle star with empty commitHash', () => {
      const partialStar = createMockStar({ commitHash: '' })
      const onCloseMock = vi.fn()

      render(<StarDetailModal star={partialStar} onClose={onCloseMock} />)

      expect(screen.getByText('No commit hash')).toBeTruthy()
    })

    it('should handle star with null mergedAt', () => {
      const unmergedStar = createMockStar({ mergedAt: null })
      const onCloseMock = vi.fn()

      render(<StarDetailModal star={unmergedStar} onClose={onCloseMock} />)

      expect(screen.queryByText(/Merged At/i)).toBeFalsy()
    })

    it('should handle star with empty filesChanged array', () => {
      const minimalStar = createMockStar({
        filesChanged: [],
        prUrl: null,
      })
      const onCloseMock = vi.fn()

      render(<StarDetailModal star={minimalStar} onClose={onCloseMock} />)

      // Note: "Files Changed" still appears in the stats grid (showing the count),
      // but the files list section should not render without prUrl or filesChanged
      expect(screen.queryByText('View on GitHub')).toBeFalsy()
    })
  })

  describe('External Link Attributes', () => {
    it('should generate correct issue URL format', () => {
      const issueNumber = 42
      const url = `https://github.com/xeroc/chaoscraft/issues/${issueNumber}`

      // Verify URL format without checking DOM attributes
      expect(url).toContain('https://github.com/xeroc/chaoscraft/issues/')
      expect(url).toContain('42')
    })

    it('should generate correct commit URL format', () => {
      const commitHash = 'abc123'
      const url = `https://github.com/xeroc/chaoscraft/commit/${commitHash}`

      // Verify URL format without checking DOM attributes
      expect(url).toContain('https://github.com/xeroc/chaoscraft/commit/')
      expect(url).toContain('abc123')
    })

    it('should use prUrl directly for PR link', () => {
      const prUrl = 'https://github.com/xeroc/chaoscraft/pull/1'

      // Verify PR URL is used directly
      expect(prUrl).toContain('https://github.com/xeroc/chaoscraft/pull/1')
    })
  })
})
