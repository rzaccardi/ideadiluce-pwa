import { beforeEach, describe, expect, it } from 'vitest'
import {
  lightsFromTheme,
  persistAppearance,
  resolveInitialAppearance,
  themeFromLights,
} from './appearance'

const storage = new Map<string, string>()

function createStorageMock(): Storage {
  return {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value)
    },
    removeItem: (key: string) => {
      storage.delete(key)
    },
    clear: () => storage.clear(),
    key: (index: number) => [...storage.keys()][index] ?? null,
    get length() {
      return storage.size
    },
  }
}

beforeEach(() => {
  storage.clear()
})

describe('themeFromLights / lightsFromTheme', () => {
  it('mappa luci accese a dark e spente a light', () => {
    expect(themeFromLights(true)).toBe('dark')
    expect(themeFromLights(false)).toBe('light')
    expect(lightsFromTheme('dark')).toBe(true)
    expect(lightsFromTheme('light')).toBe(false)
  })
})

describe('resolveInitialAppearance', () => {
  it('preferisce la chiave luci se presente', () => {
    const mock = createStorageMock()
    mock.setItem('ideadiluce:product-lights', '1')
    mock.setItem('ideadiluce:theme', 'light')

    expect(resolveInitialAppearance(mock)).toEqual({ lightsOn: true, theme: 'dark' })
  })

  it('usa il tema salvato se le luci non ci sono', () => {
    const mock = createStorageMock()
    mock.setItem('ideadiluce:theme', 'dark')

    expect(resolveInitialAppearance(mock)).toEqual({ lightsOn: true, theme: 'dark' })
  })

  it('migra dalla chiave legacy del tema', () => {
    const mock = createStorageMock()
    mock.setItem('idl-theme', 'light')

    expect(resolveInitialAppearance(mock)).toEqual({ lightsOn: false, theme: 'light' })
    expect(mock.getItem('ideadiluce:theme')).toBe('light')
  })
})

describe('persistAppearance', () => {
  it('scrive luci e tema allineati', () => {
    const mock = createStorageMock()
    persistAppearance(true, mock)

    expect(mock.getItem('ideadiluce:product-lights')).toBe('1')
    expect(mock.getItem('ideadiluce:theme')).toBe('dark')

    persistAppearance(false, mock)
    expect(mock.getItem('ideadiluce:product-lights')).toBe('0')
    expect(mock.getItem('ideadiluce:theme')).toBe('light')
  })
})
