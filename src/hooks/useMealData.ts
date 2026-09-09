import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { getMealSettings, getMeals } from '../services/mealService'

export function useMealData() {
  const query = useQuery({
    queryKey: ['meal-data'],
    queryFn: async () => {
      if (!supabase) return { icsUrl: '', meals: [] }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { icsUrl: '', meals: [] }
      const [icsUrl, meals] = await Promise.all([getMealSettings(user.id), getMeals(user.id)])
      return { icsUrl, meals }
    },
    enabled: Boolean(supabase),
    staleTime: 60_000,
    refetchInterval: 30_000,
  })
  return { icsUrl: query.data?.icsUrl ?? '', meals: query.data?.meals ?? [], isLoading: query.isLoading, isError: query.isError, error: query.error }
}
