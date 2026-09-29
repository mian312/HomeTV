import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '@/stores/session';
import { preferenceRepository } from '@/data/repositories';
import { buildPersonalizationModel } from './model';
import type { ProfileId } from '@/types/domain';

export const PERSONALIZATION_QUERY_KEY = (profileId: ProfileId) => ['personalization', profileId];

export function usePersonalizationModel() {
  const profile = useSessionStore(s => s.activeProfile);
  
  return useQuery({
    queryKey: profile ? PERSONALIZATION_QUERY_KEY(profile.id) : ['personalization', 'none'],
    queryFn: () => {
      if (!profile) throw new Error("No active profile");
      return buildPersonalizationModel(profile.id);
    },
    enabled: !!profile,
  });
}

/**
 * Hook to update a preference and invalidate the personalization model cache,
 * ensuring the UI re-renders with the latest preferences without full catalog refetch.
 */
export function useUpdatePreference() {
  const queryClient = useQueryClient();
  const profile = useSessionStore(s => s.activeProfile);

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      if (!profile) throw new Error("No active profile");
      await preferenceRepository.set(profile.id, key, value);
    },
    onSuccess: () => {
      if (profile) {
        queryClient.invalidateQueries({ queryKey: PERSONALIZATION_QUERY_KEY(profile.id) });
      }
    }
  });
}
