import { ref } from 'vue';

export interface AppError {
  message: string;
  isAuthError: boolean;
}

// Module-level — shared across all composables and components
const globalError = ref<AppError | null>(null);

export const useGlobalError = () => {
  const setError = (err: any) => {
    // Extract the actual message from a $fetch error (server message is in err.data.message)
    const serverMessage: string =
      err?.data?.message || err?.data?.statusMessage || err?.message || String(err);

    const isAuthError =
      serverMessage.includes('authentication failed') ||
      serverMessage.includes('API token') ||
      err?.status === 401 ||
      err?.statusCode === 401;

    globalError.value = { message: serverMessage, isAuthError };
  };

  const clearError = () => {
    globalError.value = null;
  };

  return { globalError, setError, clearError };
};
