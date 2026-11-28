export function getSavedTwentyFifthRule(saved = {}, fallback = false) {
  return (
    saved?.budgetLogic?.twentyFifthRule ??
    saved?.budget_logic?.twenty_fifth_rule ??
    saved?.twentyFifthRule ??
    saved?.shift25th ??
    fallback
  );
}

export function getSavedAutoSweepSurplus(saved = {}, fallback = false) {
  return (
    saved?.budgetLogic?.autoSweepSurplus ??
    saved?.budget_logic?.auto_sweep_surplus ??
    saved?.autoSweepSurplus ??
    saved?.auto_sweep ??
    fallback
  );
}

