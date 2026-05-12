/**
 * Normalize axios/network errors into a stable shape.
 * Never includes sensitive payloads or auth headers.
 */
export function normalizeApiError(error) {
  if (!error) {
    return Object.assign(new Error('Erro desconhecido.'), {
      status: 0,
      code: 'UNKNOWN'
    });
  }

  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    const serverMessage =
      data?.message ||
      data?.error ||
      data?.errors?.[0]?.message ||
      `Erro ${status}`;

    const normalized = new Error(serverMessage);
    normalized.status = status;
    normalized.code = data?.code || `HTTP_${status}`;
    normalized.details = data?.errors || data?.details || null;
    return normalized;
  }

  if (error.request) {
    const normalized = new Error('Sem resposta do servidor. Verifique sua conexão.');
    normalized.status = 0;
    normalized.code = 'NETWORK';
    return normalized;
  }

  const normalized = new Error(error.message || 'Erro inesperado.');
  normalized.status = 0;
  normalized.code = 'CLIENT';
  return normalized;
}

export function getErrorMessage(error, fallback = 'Algo deu errado.') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || fallback;
}
