import type { Package } from '@/types/types'
import Fuse from 'fuse.js'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePackageStore = defineStore('packages', () => {
  const packages_fuse_options = {
    shouldSort: true,
    threshold: 0.3,
    location: 0,
    distance: 100,
    maxPatternLength: 200,
    minMatchCharLength: 0,
    keys: ['package', 'path'],
    isCaseSensitive: false,
    ignoreLocation: true,
    useExtendedSearch: true
  }

  const packages = ref<Package[]>([])
  const packages_fuse = ref<Fuse<Package>>(new Fuse([], packages_fuse_options))
  const packages_available = ref<boolean>(false)

  function arePackagesAvailable(available: boolean) {
    packages_available.value = available
  }

  function updateAvailablePackages(new_packages: Package[]) {
    packages.value = new_packages
    packages_fuse.value = new Fuse(packages.value, packages_fuse_options)
  }

  return {
    packages,
    packages_fuse,
    packages_available,
    arePackagesAvailable,
    updateAvailablePackages
  }
})
