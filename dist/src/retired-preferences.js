// Limpa somente preferências de recursos retirados; não lê nem altera tarefas.
export function clearRetiredPreferences(storage){
  for(const key of ['entrelinhas-vida:day:v1','entrelinhas-vida:google-calendar:v1','entrelinhas-vida:agenda-pairing:v1']){
    try{storage.removeItem?.(key);}catch{}
  }
}
