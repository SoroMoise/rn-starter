import { UI_CONFIG } from '@constants/config'

interface Token {
  type: 'number' | 'operator'
  value: string
}

const OPERATORS = new Set(['+', '\u2212', '\u00D7', '\u00F7'])

function tokenize(expression: string): Token[] | null {
  if (!expression || expression.trim() === '') {
    return null
  }

  const tokens: Token[] = []
  let i = 0
  const expr = expression.trim()

  // Expression cannot start with an operator
  if (OPERATORS.has(expr[0])) {
    return null
  }

  while (i < expr.length) {
    const ch = expr[i]

    if (ch >= '0' && ch <= '9') {
      let num = ''
      let hasDot = false

      while (i < expr.length && ((expr[i] >= '0' && expr[i] <= '9') || expr[i] === '.')) {
        if (expr[i] === '.') {
          if (hasDot) return null // two decimal points
          hasDot = true
        }
        num += expr[i]
        i++
      }

      // Trailing decimal point — not a valid number
      if (num.endsWith('.')) {
        return null
      }

      tokens.push({ type: 'number', value: num })
    } else if (OPERATORS.has(ch)) {
      // Consecutive operators are invalid
      if (tokens.length > 0 && tokens[tokens.length - 1].type === 'operator') {
        return null
      }
      tokens.push({ type: 'operator', value: ch })
      i++
    } else {
      // Unknown character
      return null
    }
  }

  // Expression cannot end with an operator
  if (tokens.length === 0 || tokens[tokens.length - 1].type === 'operator') {
    return null
  }

  return tokens
}

function evaluateTokens(tokens: Token[]): number | null {
  // First pass: resolve × and ÷
  const afterMultDiv: Token[] = []

  let i = 0
  while (i < tokens.length) {
    const token = tokens[i]

    if (token.type === 'operator' && (token.value === '\u00D7' || token.value === '\u00F7')) {
      const left = afterMultDiv.pop()
      const right = tokens[i + 1]

      if (!left || !right || left.type !== 'number' || right.type !== 'number') {
        return null
      }

      const leftVal = parseFloat(left.value)
      const rightVal = parseFloat(right.value)

      if (token.value === '\u00F7') {
        if (rightVal === 0) return null // division by zero
        afterMultDiv.push({ type: 'number', value: String(leftVal / rightVal) })
      } else {
        afterMultDiv.push({ type: 'number', value: String(leftVal * rightVal) })
      }

      i += 2
    } else {
      afterMultDiv.push(token)
      i++
    }
  }

  // Second pass: resolve + and −
  if (afterMultDiv.length === 0 || afterMultDiv[0].type !== 'number') {
    return null
  }

  let result = parseFloat(afterMultDiv[0].value)

  let j = 1
  while (j < afterMultDiv.length) {
    const op = afterMultDiv[j]
    const operand = afterMultDiv[j + 1]

    if (!op || !operand || op.type !== 'operator' || operand.type !== 'number') {
      return null
    }

    const val = parseFloat(operand.value)

    if (op.value === '+') {
      result += val
    } else if (op.value === '\u2212') {
      result -= val
    } else {
      return null
    }

    j += 2
  }

  return result
}

export function evaluateExpression(expression: string): number | null {
  const tokens = tokenize(expression)

  if (tokens === null) {
    return null
  }

  const result = evaluateTokens(tokens)

  if (result === null) {
    return null
  }

  if (isNaN(result) || !isFinite(result)) {
    return null
  }

  if (result < 0) {
    return null
  }

  if (result > UI_CONFIG.MAX_AMOUNT) {
    return null
  }

  return result
}

export function formatCalculatorResult(value: number): string {
  // 12 significant digits kill float noise (0.1+0.2 → "0.3"); the fallback
  // guarantees plain decimal notation — a "1e-7" fed back as the next
  // expression would be rejected by the tokenizer.
  const rounded = Number(value.toPrecision(12))
  const str = String(rounded)
  if (!str.includes('e')) return str
  return rounded.toFixed(12).replace(/0+$/, '').replace(/\.$/, '')
}
