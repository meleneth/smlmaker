import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'

import BuildView from '@/views/BuildView.vue'
import { useProjectStore } from '@/stores/project'

describe('BuildView', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('disables SDL3 while SDL2 is selected and enables it again when cleared', async () => {
    const store = useProjectStore()
    store.addLibrary('core', 'STATIC')
    const wrapper = mount(BuildView)
    const sdl2 = wrapper.get('#build-core-dependency-sdl2')
    const sdl3 = wrapper.get('#build-core-dependency-sdl3')

    await sdl2.setValue(true)
    expect(sdl2.attributes('disabled')).toBeUndefined()
    expect(sdl3.attributes('disabled')).toBeDefined()

    await sdl2.setValue(false)
    expect(sdl3.attributes('disabled')).toBeUndefined()
  })
})
