import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTags } from '@/hooks/use-tags'

// Mock the API module
vi.mock('@/lib/api', () => ({
  tagsApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  tagMappingApi: {
    createTagMapping: vi.fn(),
    removeTagMapping: vi.fn(),
  },
}))

import { tagsApi, tagMappingApi } from '@/lib/api'

const mockedTagsApi = vi.mocked(tagsApi)
const mockedTagMappingApi = vi.mocked(tagMappingApi)

describe('useTags', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should load and sort tags by name on mount', async () => {
    const unsortedTags = [
      { id: 1, name: 'Zebra' },
      { id: 2, name: 'Apple' },
      { id: 3, name: 'Mango' },
    ]
    mockedTagsApi.getAll.mockResolvedValue(unsortedTags)

    const { result } = renderHook(() => useTags())

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.tags).toEqual([
      { id: 2, name: 'Apple' },
      { id: 3, name: 'Mango' },
      { id: 1, name: 'Zebra' },
    ])
    expect(result.current.error).toBeNull()
  })

  it('should set error when loading tags fails', async () => {
    mockedTagsApi.getAll.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useTags())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
    expect(result.current.tags).toEqual([])
  })

  it('should set fallback error message for non-Error throws', async () => {
    mockedTagsApi.getAll.mockRejectedValue('some string error')

    const { result } = renderHook(() => useTags())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to load tags')
  })

  it('should create a tag and refetch all tags', async () => {
    const initialTags = [{ id: 1, name: 'Beach' }]
    const updatedTags = [
      { id: 1, name: 'Beach' },
      { id: 2, name: 'City' },
    ]

    mockedTagsApi.getAll
      .mockResolvedValueOnce(initialTags)
      .mockResolvedValueOnce(updatedTags)
    mockedTagsApi.create.mockResolvedValue({ id: 2, name: 'City' })

    const { result } = renderHook(() => useTags())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.tags).toEqual([{ id: 1, name: 'Beach' }])

    await act(async () => {
      await result.current.createTag('City')
    })

    expect(mockedTagsApi.create).toHaveBeenCalledWith('City')
    expect(mockedTagsApi.getAll).toHaveBeenCalledTimes(2)
    expect(result.current.tags).toEqual([
      { id: 1, name: 'Beach' },
      { id: 2, name: 'City' },
    ])
  })

  it('should delete a tag and refetch all tags', async () => {
    const initialTags = [
      { id: 1, name: 'Beach' },
      { id: 2, name: 'City' },
    ]
    const updatedTags = [{ id: 1, name: 'Beach' }]

    mockedTagsApi.getAll
      .mockResolvedValueOnce(initialTags)
      .mockResolvedValueOnce(updatedTags)
    mockedTagsApi.delete.mockResolvedValue(undefined)

    const { result } = renderHook(() => useTags())

    await waitFor(() => {
      expect(result.current.tags).toHaveLength(2)
    })

    await act(async () => {
      await result.current.deleteTag(2)
    })

    expect(mockedTagsApi.delete).toHaveBeenCalledWith(2)
    expect(result.current.tags).toEqual([{ id: 1, name: 'Beach' }])
  })

  it('should update tag mappings (create and delete)', async () => {
    mockedTagsApi.getAll.mockResolvedValue([])
    mockedTagMappingApi.createTagMapping.mockResolvedValue(undefined)
    mockedTagMappingApi.removeTagMapping.mockResolvedValue(undefined)

    const { result } = renderHook(() => useTags())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.updateTags(10, [1, 2], [3])
    })

    expect(mockedTagMappingApi.createTagMapping).toHaveBeenCalledTimes(2)
    expect(mockedTagMappingApi.createTagMapping).toHaveBeenCalledWith(10, 1)
    expect(mockedTagMappingApi.createTagMapping).toHaveBeenCalledWith(10, 2)
    expect(mockedTagMappingApi.removeTagMapping).toHaveBeenCalledTimes(1)
    expect(mockedTagMappingApi.removeTagMapping).toHaveBeenCalledWith(10, 3)
  })

  it('should refetch tags when refetchTags is called', async () => {
    const firstLoad = [{ id: 1, name: 'Beach' }]
    const secondLoad = [
      { id: 1, name: 'Beach' },
      { id: 2, name: 'Mountain' },
    ]

    mockedTagsApi.getAll
      .mockResolvedValueOnce(firstLoad)
      .mockResolvedValueOnce(secondLoad)

    const { result } = renderHook(() => useTags())

    await waitFor(() => {
      expect(result.current.tags).toHaveLength(1)
    })

    await act(async () => {
      await result.current.refetchTags()
    })

    expect(result.current.tags).toEqual([
      { id: 1, name: 'Beach' },
      { id: 2, name: 'Mountain' },
    ])
    expect(mockedTagsApi.getAll).toHaveBeenCalledTimes(2)
  })
})
