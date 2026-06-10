export type ParsedDice = {
  readonly count: number;
  readonly sides: number;
  readonly modifier: number;
};

export type RandomSource = () => number;

export type RollResult = {
  readonly expression: string;
  readonly rolls: readonly number[];
  readonly modifier: number;
  readonly total: number;
};

export type D20Mode = "normal" | "advantage" | "disadvantage";

export type D20Result = {
  readonly mode: D20Mode;
  readonly rolls: readonly number[];
  readonly selected: number;
  readonly modifier: number;
  readonly total: number;
  readonly isCritical: boolean;
  readonly isFumble: boolean;
};

export type ResistanceMode = "normal" | "half" | "double" | "immune";

export type DamageResult = {
  readonly dice: string;
  readonly rolls: readonly number[];
  readonly modifier: number;
  readonly rawTotal: number;
  readonly total: number;
  readonly mode: ResistanceMode;
  readonly critical: boolean;
};

export type AttackResult = {
  readonly roll: D20Result;
  readonly targetAc: number;
  readonly attackBonus: number;
  readonly hit: boolean;
  readonly critical: boolean;
};

const defaultRandom: RandomSource = Math.random;

export function parseDice(expression: string): ParsedDice {
  const match = /^(\d+)d(\d+)([+-]\d+)?$/.exec(expression.trim());

  if (!match) {
    throw new Error(`Invalid dice expression: ${expression}`);
  }

  return {
    count: Number(match[1]),
    sides: Number(match[2]),
    modifier: Number(match[3] ?? 0),
  };
}

function formatModifier(modifier: number) {
  if (modifier === 0) {
    return "";
  }

  return modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`;
}

export function formatRollExpression({
  expression,
  rolls,
  modifier,
}: {
  readonly expression: string;
  readonly rolls: readonly number[];
  readonly modifier: number;
}) {
  const baseExpression = expression.replace(/[+-]\d+$/, "");

  return `${baseExpression} [${rolls.join(", ")}]${formatModifier(modifier)}`;
}

function rollDie(sides: number, random: RandomSource) {
  return Math.floor(random() * sides) + 1;
}

export function roll(expression: string, random: RandomSource = defaultRandom): RollResult {
  const parsed = parseDice(expression);
  const rolls = Array.from({ length: parsed.count }, () => rollDie(parsed.sides, random));
  const total = rolls.reduce((sum, value) => sum + value, parsed.modifier);

  return {
    expression,
    rolls,
    modifier: parsed.modifier,
    total,
  };
}

export function rollD20({
  advantage = false,
  disadvantage = false,
  modifier = 0,
  random = defaultRandom,
}: {
  readonly advantage?: boolean;
  readonly disadvantage?: boolean;
  readonly modifier?: number;
  readonly random?: RandomSource;
}): D20Result {
  const mode: D20Mode =
    advantage && !disadvantage ? "advantage" : disadvantage && !advantage ? "disadvantage" : "normal";
  const rolls =
    mode === "normal" ? [rollDie(20, random)] : [rollDie(20, random), rollDie(20, random)];
  const selected =
    mode === "advantage" ? Math.max(...rolls) : mode === "disadvantage" ? Math.min(...rolls) : rolls[0];

  return {
    mode,
    rolls,
    selected,
    modifier,
    total: selected + modifier,
    isCritical: selected === 20,
    isFumble: selected === 1,
  };
}

export function resolveAttack({
  attackBonus,
  targetAc,
  advantage = false,
  disadvantage = false,
  random = defaultRandom,
}: {
  readonly attackBonus: number;
  readonly targetAc: number;
  readonly advantage?: boolean;
  readonly disadvantage?: boolean;
  readonly random?: RandomSource;
}): AttackResult {
  const d20 = rollD20({
    advantage,
    disadvantage,
    modifier: attackBonus,
    random,
  });
  const hit = d20.isCritical || (!d20.isFumble && d20.total >= targetAc);

  return {
    roll: d20,
    targetAc,
    attackBonus,
    hit,
    critical: d20.isCritical,
  };
}

function applyResistanceMode(rawTotal: number, mode: ResistanceMode) {
  if (mode === "immune") {
    return 0;
  }

  if (mode === "half") {
    return Math.floor(rawTotal / 2);
  }

  if (mode === "double") {
    return rawTotal * 2;
  }

  return rawTotal;
}

export function resolveDamage({
  dice,
  mode = "normal",
  critical = false,
  random = defaultRandom,
}: {
  readonly dice: string;
  readonly mode?: ResistanceMode;
  readonly critical?: boolean;
  readonly random?: RandomSource;
}): DamageResult {
  const parsed = parseDice(dice);
  const diceCount = critical ? parsed.count * 2 : parsed.count;
  const rolls = Array.from({ length: diceCount }, () => rollDie(parsed.sides, random));
  const rawTotal = rolls.reduce((sum, value) => sum + value, parsed.modifier);

  return {
    dice,
    rolls,
    modifier: parsed.modifier,
    rawTotal,
    total: applyResistanceMode(rawTotal, mode),
    mode,
    critical,
  };
}
