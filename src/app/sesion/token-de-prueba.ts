function base64Url(objeto: object): string {
  return btoa(JSON.stringify(objeto)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** JWT falso solo para specs: cabecera y payload reales en base64url, firma inventada. */
export function tokenConPayload(payload: object): string {
  return `${base64Url({ alg: 'RS256' })}.${base64Url(payload)}.firma`;
}

export function tokenQueCaduca(exp: number): string {
  return tokenConPayload({ exp });
}
