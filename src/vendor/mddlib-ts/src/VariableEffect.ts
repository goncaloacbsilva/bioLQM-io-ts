export enum VariableEffect {
  NONE,
  POSITIVE,
  NEGATIVE,
  DUAL
}

export function combineVariableEffects(
  current: VariableEffect,
  other: VariableEffect
): VariableEffect {
  if (current === VariableEffect.NONE) {
    return other;
  }

  if (current === other || other === VariableEffect.NONE) {
    return current;
  }

  return VariableEffect.DUAL;
}
