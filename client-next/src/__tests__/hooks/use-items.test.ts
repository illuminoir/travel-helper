import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useItems } from '@/hooks/use-items'

vi.mock('@/lib/api', () => ({
  itemsApi: {
    getAll: vi.fn(),
    delete: vi.fn(),
    add: vi.fn(),
  },
}))

import { itemsApi } from '@/lib/api'

const mockedItemsApi = vi.mocked(itemsApi)

const mockItems = [
  { id: 1, name: 'Backpack', weight: 2, tags: [{ id: 1, name: 'Gear' }] },
  { id: 2, name: 'Tent', weight: 5, tags: [] },
  { id: 3, name: 'Map', weight: 0.1, tags: [{ id: 2, name: 'Navigation' }] },
]

describe('useItems', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should load items from API on mount', async () => {
    mockedItemsApi.getAll.mockResolvedValue(mockItems)

    const { result } = renderHook(() => useItems())

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.items).toEqual(mockItems)
    expect(result.current.droppedItems).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('should filter out dropped items from localStorage', async () => {
    const droppedItem = mockItems[0]
    localStorage.setItem('droppedItems', JSON.stringify([droppedItem]))
    mockedItemsApi.getAll.mockResolvedValue(mockItems)

    const { result } = renderHook(() => useItems())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.items).toEqual([mockItems[1], mockItems[2]])
    expect(result.current.droppedItems).toEqual([droppedItem])
  })

  it('should handle corrupted localStorage data', async () => {
    localStorage.setItem('droppedItems', 'not valid json{{{')
    mockedItemsApi.getAll.mockResolvedValue(mockItems)

    const { result } = renderHook(() => useItems())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.items).toEqual(mockItems)
    expect(result.current.droppedItems).toEqual([])
    expect(localStorage.getItem('droppedItems')).toBeNull()
  })

  it('should set error when API call fails', async () => {
    mockedItemsApi.getAll.mockRejectedValue(new Error('Server down'))

    const { result } = renderHook(() => useItems())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Server down')
  })

  it('should delete an item from items list via API', async () => {
    mockedItemsApi.getAll.mockResolvedValue(mockItems)
    mockedItemsApi.delete.mockResolvedValue(undefined)

    const { result } = renderHook(() => useItems())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.deleteItem(1, false)
    })

    expect(mockedItemsApi.delete).toHaveBeenCalledWith(1)
    expect(result.current.items.find((i) => i.id === 1)).toBeUndefined()
  })

  it('should delete a dropped item from local state only', async () => {
    const droppedItem = mockItems[0]
    localStorage.setItem('droppedItems', JSON.stringify([droppedItem]))
    mockedItemsApi.getAll.mockResolvedValue(mockItems)

    const { result } = renderHook(() => useItems())

    await waitFor(() => {
      expect(result.current.droppedItems).toHaveLength(1)
    })

    await act(async () => {
      await result.current.deleteItem(1, true)
    })

    expect(mockedItemsApi.delete).not.toHaveBeenCalled()
    expect(result.current.droppedItems).toEqual([])
  })

  it('should add a new item and refresh the list', async () => {
    mockedItemsApi.getAll
      .mockResolvedValueOnce(mockItems)
      .mockResolvedValueOnce([...mockItems, { id: 4, name: 'Compass', weight: 0.2, tags: [] }])
    mockedItemsApi.add.mockResolvedValue({ id: 4, name: 'Compass', weight: 0.2, tags: [] })

    const { result } = renderHook(() => useItems())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.addItem('Compass', 0.2)
    })

    expect(mockedItemsApi.add).toHaveBeenCalledWith('Compass', 0.2)
    expect(result.current.items).toHaveLength(4)
  })

  it('should move an item to dropped', async () => {
    mockedItemsApi.getAll.mockResolvedValue(mockItems)

    const { result } = renderHook(() => useItems())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    act(() => {
      result.current.moveItem(mockItems[0], true)
    })

    expect(result.current.items.find((i) => i.id === 1)).toBeUndefined()
    expect(result.current.droppedItems.find((i) => i.id === 1)).toBeDefined()
  })

  it('should move an item back from dropped', async () => {
    const droppedItem = mockItems[0]
    localStorage.setItem('droppedItems', JSON.stringify([droppedItem]))
    mockedItemsApi.getAll.mockResolvedValue(mockItems)

    const { result } = renderHook(() => useItems())

    await waitFor(() => {
      expect(result.current.droppedItems).toHaveLength(1)
    })

    act(() => {
      result.current.moveItem(droppedItem, false)
    })

    expect(result.current.droppedItems).toEqual([])
    expect(result.current.items.find((i) => i.id === 1)).toBeDefined()
  })

  it('should not duplicate items when moving', async () => {
    mockedItemsApi.getAll.mockResolvedValue(mockItems)

    const { result } = renderHook(() => useItems())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Move to dropped twice
    act(() => {
      result.current.moveItem(mockItems[0], true)
    })
    act(() => {
      result.current.moveItem(mockItems[0], true)
    })

    expect(result.current.droppedItems.filter((i) => i.id === 1)).toHaveLength(1)
  })

  it('should clear all dropped items', async () => {
    const droppedItem = mockItems[0]
    localStorage.setItem('droppedItems', JSON.stringify([droppedItem]))
    mockedItemsApi.getAll.mockResolvedValue(mockItems)

    const { result } = renderHook(() => useItems())

    await waitFor(() => {
      expect(result.current.droppedItems).toHaveLength(1)
    })

    act(() => {
      result.current.clearDropped()
    })

    expect(result.current.droppedItems).toEqual([])
  })

  it('should refetch items when refetchItems is called', async () => {
    const updatedItems = [...mockItems, { id: 4, name: 'Compass', weight: 0.2, tags: [] }]
    mockedItemsApi.getAll
      .mockResolvedValueOnce(mockItems)
      .mockResolvedValueOnce(updatedItems)

    const { result } = renderHook(() => useItems())

    await waitFor(() => {
      expect(result.current.items).toHaveLength(3)
    })

    await act(async () => {
      await result.current.refetchItems()
    })

    expect(result.current.items).toHaveLength(4)
    expect(mockedItemsApi.getAll).toHaveBeenCalledTimes(2)
  })
})
