import {
  useMutation,
  type UseMutationResult,
  type MutationFunction,
  type MutationOptions,
} from '@tanstack/react-query';
import { offlineQueue, type OfflineOperationType } from '@/src/lib/offlineQueue';
import { useNetworkState } from './useNetworkState';

export interface OfflineOperationInput<TVariables> {
  type: OfflineOperationType | ((variables: TVariables) => OfflineOperationType);
  payload: (variables: TVariables) => Record<string, unknown>;
}

export interface UseOfflineMutationOptions<TData, TError, TVariables, TContext>
  extends Omit<MutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'> {
  mutationFn: MutationFunction<TData, TVariables>;
  offlineOperation: OfflineOperationInput<TVariables>;
}

/**
 * Wrapper around TanStack Query's useMutation that:
 *  - Applies optimistic updates immediately via onMutate/onError.
 *  - Enqueues the operation in the offline write queue when the device is offline.
 *  - Runs the repository call directly when online.
 *
 * The caller supplies `offlineOperation` so the queue knows how to replay the
 * mutation later. Optimistic rollback remains the caller's responsibility via
 * the standard useMutation onMutate/onError lifecycle.
 *
 * NOTE: Callers that invalidate queries in onSettled should guard on isOnline
 * so that the optimistic update is not overwritten by a refetch while still
 * offline. The queue replay updates the real backend when connectivity returns.
 */
export function useOfflineMutation<TData = unknown, TError = Error, TVariables = void, TContext = unknown>(
  options: UseOfflineMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
  const { isOnline } = useNetworkState();
  const { offlineOperation, mutationFn, ...rest } = options;

  return useMutation({
    ...rest,
    mutationFn: async (variables: TVariables, context) => {
      if (!isOnline) {
        const operationType =
          typeof offlineOperation.type === 'function'
            ? offlineOperation.type(variables)
            : offlineOperation.type;
        offlineQueue.enqueue({
          type: operationType,
          payload: offlineOperation.payload(variables),
        });
        if (__DEV__) {
          console.log('[OfflineMutation] enqueued', operationType, offlineQueue.length);
        }

        // Return a sentinel so callers can treat offline enqueue as a success
        // while the real repository call is replayed later.
        return undefined as TData;
      }

      return mutationFn(variables, context);
    },
  });
}
