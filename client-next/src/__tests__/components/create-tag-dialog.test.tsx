import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CreateTagDialog } from '@/components/create-tag-dialog'

describe('CreateTagDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onCreateTag: vi.fn().mockResolvedValue(undefined),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the dialog when open', () => {
    render(<CreateTagDialog {...defaultProps} />)

    expect(screen.getByText('Create New Tag')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Tag name')).toBeInTheDocument()
    expect(screen.getByText('Create')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('should not render dialog content when closed', () => {
    render(<CreateTagDialog {...defaultProps} isOpen={false} />)

    expect(screen.queryByText('Create New Tag')).not.toBeInTheDocument()
  })

  it('should show error when trying to create empty tag', async () => {
    const user = userEvent.setup()
    render(<CreateTagDialog {...defaultProps} />)

    await user.click(screen.getByText('Create'))

    expect(screen.getByText('Tag name cannot be empty')).toBeInTheDocument()
    expect(defaultProps.onCreateTag).not.toHaveBeenCalled()
  })

  it('should show error for whitespace-only tag name', async () => {
    const user = userEvent.setup()
    render(<CreateTagDialog {...defaultProps} />)

    await user.type(screen.getByPlaceholderText('Tag name'), '   ')
    await user.click(screen.getByText('Create'))

    expect(screen.getByText('Tag name cannot be empty')).toBeInTheDocument()
    expect(defaultProps.onCreateTag).not.toHaveBeenCalled()
  })

  it('should call onCreateTag with tag name and close', async () => {
    const user = userEvent.setup()
    render(<CreateTagDialog {...defaultProps} />)

    await user.type(screen.getByPlaceholderText('Tag name'), 'Beach')
    await user.click(screen.getByText('Create'))

    expect(defaultProps.onCreateTag).toHaveBeenCalledWith('Beach')
    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalled()
    })
  })

  it('should create tag on Enter key press', async () => {
    const user = userEvent.setup()
    render(<CreateTagDialog {...defaultProps} />)

    const input = screen.getByPlaceholderText('Tag name')
    await user.type(input, 'Mountain{Enter}')

    expect(defaultProps.onCreateTag).toHaveBeenCalledWith('Mountain')
  })

  it('should show error when onCreateTag fails', async () => {
    const failingProps = {
      ...defaultProps,
      onCreateTag: vi.fn().mockRejectedValue(new Error('Duplicate tag')),
    }
    const user = userEvent.setup()
    render(<CreateTagDialog {...failingProps} />)

    await user.type(screen.getByPlaceholderText('Tag name'), 'Beach')
    await user.click(screen.getByText('Create'))

    await waitFor(() => {
      expect(screen.getByText('Duplicate tag')).toBeInTheDocument()
    })
    expect(failingProps.onClose).not.toHaveBeenCalled()
  })

  it('should call onClose when Cancel is clicked', async () => {
    const user = userEvent.setup()
    render(<CreateTagDialog {...defaultProps} />)

    await user.click(screen.getByText('Cancel'))

    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('should clear input and error when dialog is closed', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<CreateTagDialog {...defaultProps} />)

    // Type something and trigger an error
    await user.click(screen.getByText('Create'))
    expect(screen.getByText('Tag name cannot be empty')).toBeInTheDocument()

    // Close and reopen
    rerender(<CreateTagDialog {...defaultProps} isOpen={false} />)
    rerender(<CreateTagDialog {...defaultProps} isOpen={true} />)

    expect(screen.queryByText('Tag name cannot be empty')).not.toBeInTheDocument()
  })
})
