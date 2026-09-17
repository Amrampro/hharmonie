export function sendApiError(res, error) {
  const messages = {
    ER_NO_SUCH_TABLE: [503, "La base de données doit être mise à jour. Contactez l’administrateur.", "DATABASE_SCHEMA_OUTDATED"],
    ER_BAD_FIELD_ERROR: [503, "La base de données doit être mise à jour. Contactez l’administrateur.", "DATABASE_SCHEMA_OUTDATED"],
    ER_DUP_ENTRY: [409, "Cette valeur existe déjà. Vérifiez le nom, le code ou le lien permanent.", "DUPLICATE_VALUE"],
    ER_DATA_TOO_LONG: [400, "Un champ dépasse la longueur autorisée.", "VALUE_TOO_LONG"],
    ER_BAD_NULL_ERROR: [400, "Un champ obligatoire est vide.", "REQUIRED_VALUE"],
    ER_TRUNCATED_WRONG_VALUE: [400, "Une date ou une valeur numérique est invalide.", "INVALID_VALUE"],
    ER_TRUNCATED_WRONG_VALUE_FOR_FIELD: [400, "Une valeur ne correspond pas au format attendu.", "INVALID_VALUE"],
    WARN_DATA_TRUNCATED: [400, "Une valeur ne correspond pas aux choix autorisés.", "INVALID_VALUE"],
    ER_NO_REFERENCED_ROW_2: [400, "L’élément associé n’existe plus. Rechargez le formulaire.", "INVALID_REFERENCE"],
    ER_ROW_IS_REFERENCED_2: [409, "Cet élément est encore utilisé et ne peut pas être supprimé.", "ELEMENT_IN_USE"],
  };
  const mapped = messages[error.code];
  if (mapped) return res.status(mapped[0]).json({ error: mapped[1], code: mapped[2] });
  const status = Number(error.statusCode || error.status);
  if (status >= 400 && status < 500) {
    return res.status(status).json({ error: error.message, ...(error.details ? { details: error.details } : {}) });
  }
  return res.status(500).json({ error: "Internal server error" });
}
