/** Réponse de l'endpoint de santé de l'API. */
export interface HealthResponse {
  status: 'ok'
  timestamp: number
}

/** Forme standard d'une erreur renvoyée par l'API. */
export interface ApiErrorResponse {
  error: string
}
