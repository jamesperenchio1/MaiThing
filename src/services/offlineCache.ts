import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import type { DehydrateOptions } from '@tanstack/react-query';
import superjson from 'superjson';

export const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  serialize: superjson.stringify,
  deserialize: (data: string) => superjson.parse(data),
});

export const dehydrateOptions: DehydrateOptions = {
  shouldDehydrateQuery: (query) => {
    const queryKey = query.queryKey[0];
    if (queryKey === 'notifications' || queryKey === 'messages') {
      return false;
    }
    return query.state.status === 'success';
  },
};
