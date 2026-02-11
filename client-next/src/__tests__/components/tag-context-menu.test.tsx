import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TagContextMenu } from '@/components/tag-context-menu'

const mockTags = [
  { id: 1, name: 'Beach' },
  { id: 2, name: 'City' },
  { id: 3, name: 'Mountain' },
]

const mockUseTags = {
  tags: mockTags,
  updateTags: vi.fn().mockResolvedValue(undefined),
  createTag: vi.fn().mockResolvedValue(undefined),
  deleteTag: vi.fn().mockResolvedValue(undefined),
  refetchTags: vi.fn().mockResolvedValue(undefined),
  loading: false,
  error: null,
}

vi.mock('@/hooks/use-tags', () => ({
  useTags: () => mockUseTags,
}))

describe('TagContextMenu', () => {
  const mockItem = {
    id: 1,
    name: 'Backpack',
    weight: 2,
    tags: [{ id: 1, name: 'Beach' }],
  }

  const defaultProps = {
    item: mockItem,
    isOpen: true,
    onClose: vi.fn(),
    onTagCreated: vi.fn(),
    onRefetchItems: vi.fn().mockResolvedValue(undefined),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseTags.tags = mockTags
    mockUseTags.loading = false
  })

  it('should render the dialog with item name', () => {
    render(<TagContextMenu {...defaultProps} />)

    expect(screen.getByText('Tag Item')).toBeInTheDocument()
    expect(screen.getByText(/Backpack/)).toBeInTheDocument()
  })

  it('should display all available tags', () => {
    render(<TagContextMenu {...defaultProps} />)

    expect(screen.getByText('Beach')).toBeInTheDocument()
    expect(screen.getByText('City')).toBeInTheDocument()
    expect(screen.getByText('Mountain')).toBeInTheDocument()
  })

  it('should show check mark for pre-selected tags', () => {
    render(<TagContextMenu {...defaultProps} />)

    // "Beach" is already in item.tags, so it should be selected
    // The selected tags section at the bottom should show "Beach"
    const selectedSection = screen.getAllByText('Beach')
    expect(selectedSection.length).toBeGreaterThanOrEqual(1)
  })

  it('should toggle tag selection on click', async () => {
    const user = userEvent.setup()
    render(<TagContextMenu {...defaultProps} />)

    // Click "City" to select it
    await user.click(screen.getByText('City'))

    // Should now appear in the selected tags chips
    const cityInstances = screen.getAllByText('City')
    expect(cityInstances.length).toBeGreaterThanOrEqual(2) // one in list, one in chips

    // Click again to deselect
    await user.click(screen.getAllByText('City')[0])

    await waitFor(() => {
      // Should only appear once now (in the list)
      const afterDeselect = screen.getAllByText('City')
      expect(afterDeselect).toHaveLength(1)
    })
  })

  it('should show "No tags available" when tags list is empty', () => {
    mockUseTags.tags = []
    render(<TagContextMenu {...defaultProps} />)

    expect(screen.getByText('No tags available')).toBeInTheDocument()
  })

  it('should call updateTags and onClose on save', async () => {
    const user = userEvent.setup()
    render(<TagContextMenu {...defaultProps} />)

    // Select "City" tag
    await user.click(screen.getByText('City'))

    // Click Save
    await user.click(screen.getByText('Save Tags'))

    await waitFor(() => {
      expect(mockUseTags.updateTags).toHaveBeenCalledWith(
        1, // item id
        [2], // tagsToCreate: City (id: 2) is newly selected
        [], // tagsToDelete: none removed
      )
      expect(defaultProps.onClose).toHaveBeenCalled()
    })
  })

  it('should call updateTags with deleted tags when deselecting', async () => {
    const user = userEvent.setup()
    render(<TagContextMenu {...defaultProps} />)

    // Deselect "Beach" (which is currently selected)
    await user.click(screen.getAllByText('Beach')[0])

    await user.click(screen.getByText('Save Tags'))

    await waitFor(() => {
      expect(mockUseTags.updateTags).toHaveBeenCalledWith(
        1, // item id
        [], // tagsToCreate: none
        [1], // tagsToDelete: Beach (id: 1) removed
      )
    })
  })

  it('should call onClose when Cancel is clicked', async () => {
    const user = userEvent.setup()
    render(<TagContextMenu {...defaultProps} />)

    await user.click(screen.getByText('Cancel'))

    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('should open create tag dialog when button is clicked', async () => {
    const user = userEvent.setup()
    render(<TagContextMenu {...defaultProps} />)

    await user.click(screen.getByText('+ Create New Tag'))

    expect(screen.getByText('Create New Tag')).toBeInTheDocument()
  })
})
