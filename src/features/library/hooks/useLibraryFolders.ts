import { useMemo } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import { LIST_TEMPLATES, listaFijaId, type LibraryFolder } from '../data/plantillasListas'
import { useUserAudios } from './useUserAudios'
import { useUserListas } from './useUserListas'

/**
 * Carpetas de la biblioteca (categorías fijas + listas personalizadas) listas para
 * TemplateGrid/PanelAnadirAudios. Compartido entre Biblioteca y el Inicio para que
 * ambos vean exactamente las mismas carpetas y contadores de audios.
 */
export function useLibraryFolders() {
  const { user } = useAuth()
  const { audios, isLoading: isLoadingAudios } = useUserAudios()
  const { listas, isLoading: isLoadingListas, error: listasError } = useUserListas()

  const folders = useMemo<LibraryFolder[]>(() => {
    if (!user) {
      return []
    }

    const audioIdSet = new Set(audios.map((audio) => audio.id))
    const countExisting = (ids: string[]) => ids.reduce((total, id) => (audioIdSet.has(id) ? total + 1 : total), 0)

    const fixedIds = new Set(LIST_TEMPLATES.map((template) => listaFijaId(user.uid, template.id)))

    const fixedFolders = LIST_TEMPLATES.map((template): LibraryFolder => {
      const listaId = listaFijaId(user.uid, template.id)
      const lista = listas.find((item) => item.id === listaId)
      const audioIds = lista?.audioIds ?? []

      return {
        key: template.id,
        listaId,
        name: template.label,
        template: template.id,
        isCustom: false,
        audioIds,
        count: countExisting(audioIds),
      }
    })

    const customFolders = listas
      .filter((lista) => !fixedIds.has(lista.id))
      .map((lista): LibraryFolder => ({
        key: lista.id,
        listaId: lista.id,
        name: lista.name,
        template: lista.template,
        isCustom: true,
        audioIds: lista.audioIds,
        count: countExisting(lista.audioIds),
      }))

    return [...fixedFolders, ...customFolders]
  }, [user, listas, audios])

  return {
    folders,
    audios,
    isLoadingAudios,
    isLoadingListas,
    error: listasError,
  }
}
