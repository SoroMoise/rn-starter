import { UI_CONFIG } from '@constants/config'
import { evaluateExpression, formatCalculatorResult } from '@utils/evaluateExpression'
import { useCallback, useEffect, useRef, useState } from 'react'

const OP_MINUS = '\u2212'
const OP_MULTIPLY = '\u00D7'
const OP_DIVIDE = '\u00F7'
const OPERATORS = new Set(['+', OP_MINUS, OP_MULTIPLY, OP_DIVIDE])

const MAX_EXPRESSION_LENGTH = 50

interface CalculatorState {
  expression: string
  displayExpression: string
  currentNumber: string
  result: string
  hasError: boolean
  lastOperator: string | null
  isNewNumber: boolean
  cursorPosition: number
}

const INITIAL_STATE: CalculatorState = {
  expression: '',
  displayExpression: '',
  currentNumber: '',
  result: '',
  hasError: false,
  lastOperator: null,
  isNewNumber: false,
  cursorPosition: 0,
}

function formatDisplayExpression(expr: string): string {
  let result = ''
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i]
    if (OPERATORS.has(ch)) {
      result += ` ${ch} `
    } else {
      result += ch
    }
  }
  return result
}

function getCurrentNumber(expression: string): string {
  if (!expression) return ''
  let lastOpIndex = -1
  for (let i = expression.length - 1; i >= 0; i--) {
    if (OPERATORS.has(expression[i])) {
      lastOpIndex = i
      break
    }
  }
  return expression.slice(lastOpIndex + 1)
}

function getNumberSegmentAtCursor(
  expression: string,
  cursor: number
): { start: number; end: number; segment: string } {
  let start = cursor
  while (start > 0 && !OPERATORS.has(expression[start - 1])) start--
  let end = cursor
  while (end < expression.length && !OPERATORS.has(expression[end])) end++
  return { start, end, segment: expression.slice(start, end) }
}

function insertAt(str: string, insertion: { pos: number; value: string }): string {
  return str.slice(0, insertion.pos) + insertion.value + str.slice(insertion.pos)
}

function removeAt(str: string, pos: number): string {
  return str.slice(0, pos) + str.slice(pos + 1)
}

function buildState(expression: string, overrides: Partial<CalculatorState> = {}): CalculatorState {
  const currentNumber = getCurrentNumber(expression)
  const lastChar = expression[expression.length - 1] ?? null
  const lastOperator = lastChar !== null && OPERATORS.has(lastChar) ? lastChar : null

  return {
    expression,
    displayExpression: formatDisplayExpression(expression),
    currentNumber,
    result: '',
    hasError: false,
    lastOperator,
    isNewNumber: false,
    cursorPosition: expression.length,
    ...overrides,
  }
}

export function useCalculator(onResult?: (value: string) => void) {
  const [state, setState] = useState<CalculatorState>(INITIAL_STATE)
  const evaluatedResult = useRef<string | null>(null)
  const [evaluateCount, setEvaluateCount] = useState(0)

  const appendDigit = useCallback((digit: string) => {
    setState((prev) => {
      if (prev.hasError) {
        return buildState(digit, { cursorPosition: 1 })
      }

      if (prev.isNewNumber) {
        const lastChar = prev.expression[prev.expression.length - 1]
        if (lastChar && !OPERATORS.has(lastChar)) {
          return buildState(digit, { cursorPosition: 1 })
        }
      }

      const cursor = prev.cursorPosition
      const expression = insertAt(prev.expression, { pos: cursor, value: digit })
      if (expression.length > MAX_EXPRESSION_LENGTH) return prev
      return buildState(expression, { cursorPosition: cursor + 1 })
    })
  }, [])

  const appendOperator = useCallback((op: string) => {
    setState((prev) => {
      if (!prev.expression || prev.hasError) return prev

      const cursor = prev.cursorPosition
      const charBefore = cursor > 0 ? prev.expression[cursor - 1] : null
      const charAfter = cursor < prev.expression.length ? prev.expression[cursor] : null

      if (charBefore && OPERATORS.has(charBefore)) {
        const expression = prev.expression.slice(0, cursor - 1) + op + prev.expression.slice(cursor)
        return buildState(expression, { cursorPosition: cursor, isNewNumber: true })
      }

      if (charAfter && OPERATORS.has(charAfter)) {
        const expression = prev.expression.slice(0, cursor) + op + prev.expression.slice(cursor + 1)
        return buildState(expression, { cursorPosition: cursor + 1, isNewNumber: true })
      }

      if (cursor === 0) return prev

      const expression = insertAt(prev.expression, { pos: cursor, value: op })
      if (expression.length > MAX_EXPRESSION_LENGTH) return prev
      return buildState(expression, { cursorPosition: cursor + 1, isNewNumber: true })
    })
  }, [])

  const appendDecimal = useCallback(() => {
    setState((prev) => {
      if (prev.hasError) return prev

      const cursor = prev.cursorPosition

      if (prev.isNewNumber) {
        const lastChar = prev.expression[prev.expression.length - 1]
        if (lastChar && !OPERATORS.has(lastChar)) {
          return buildState('0.', { cursorPosition: 2 })
        }
      }

      if (!prev.expression) {
        return buildState('0.', { cursorPosition: 2 })
      }

      const { segment, start } = getNumberSegmentAtCursor(prev.expression, cursor)
      if (segment.includes('.')) return prev

      const charBefore = cursor > 0 ? prev.expression[cursor - 1] : null
      if (!charBefore || OPERATORS.has(charBefore) || cursor === start) {
        const expression = insertAt(prev.expression, { pos: cursor, value: '0.' })
        if (expression.length > MAX_EXPRESSION_LENGTH) return prev
        return buildState(expression, { cursorPosition: cursor + 2 })
      }

      const expression = insertAt(prev.expression, { pos: cursor, value: '.' })
      if (expression.length > MAX_EXPRESSION_LENGTH) return prev
      return buildState(expression, { cursorPosition: cursor + 1 })
    })
  }, [])

  const applyPercent = useCallback(() => {
    setState((prev) => {
      if (prev.hasError || !prev.expression || !prev.currentNumber) return prev

      const percentValue = parseFloat(prev.currentNumber)
      if (isNaN(percentValue)) return prev

      const baseExpr = prev.expression.slice(0, prev.expression.length - prev.currentNumber.length)

      if (!baseExpr) {
        const converted = percentValue / 100
        if (converted > UI_CONFIG.MAX_AMOUNT) return prev
        const expression = formatCalculatorResult(converted)
        return buildState(expression)
      }

      const operator = baseExpr[baseExpr.length - 1]
      if (!OPERATORS.has(operator)) return prev

      const leftExpr = baseExpr.slice(0, -1)
      const baseValue = evaluateExpression(leftExpr)
      if (baseValue === null) return prev

      let resolved: number

      if (operator === '+') {
        resolved = baseValue + baseValue * (percentValue / 100)
      } else if (operator === OP_MINUS) {
        resolved = baseValue - baseValue * (percentValue / 100)
      } else if (operator === OP_MULTIPLY) {
        resolved = baseValue * (percentValue / 100)
      } else if (operator === OP_DIVIDE) {
        const divisor = percentValue / 100
        if (divisor === 0) return prev
        resolved = baseValue / divisor
      } else {
        return prev
      }

      if (resolved < 0 || resolved > UI_CONFIG.MAX_AMOUNT) return prev

      const expression = formatCalculatorResult(resolved)
      return buildState(expression, { result: expression })
    })
  }, [])

  const evaluate = useCallback(() => {
    setState((prev) => {
      if (prev.hasError || !prev.expression) return prev

      const result = evaluateExpression(prev.expression)

      if (result === null) {
        return {
          ...prev,
          hasError: true,
          result: '',
        }
      }

      const resultStr = formatCalculatorResult(result)
      evaluatedResult.current = resultStr

      return {
        ...prev,
        expression: resultStr,
        displayExpression: resultStr,
        currentNumber: resultStr,
        result: resultStr,
        hasError: false,
        lastOperator: null,
        isNewNumber: true,
        cursorPosition: resultStr.length,
      }
    })
    setEvaluateCount((c) => c + 1)
  }, [])

  useEffect(() => {
    if (evaluatedResult.current !== null) {
      onResult?.(evaluatedResult.current)
      evaluatedResult.current = null
    }
  }, [evaluateCount, onResult])

  const clear = useCallback(() => {
    setState(INITIAL_STATE)
  }, [])

  const backspace = useCallback(() => {
    setState((prev) => {
      if (prev.hasError) return INITIAL_STATE
      if (!prev.expression || prev.cursorPosition === 0) return prev

      const cursor = prev.cursorPosition
      const expression = removeAt(prev.expression, cursor - 1)
      return buildState(expression, { cursorPosition: cursor - 1 })
    })
  }, [])

  const reset = useCallback((initialValue?: string) => {
    if (!initialValue) {
      setState(INITIAL_STATE)
      return
    }
    setState(buildState(initialValue))
  }, [])

  const setCursorPosition = useCallback((pos: number) => {
    setState((prev) => ({
      ...prev,
      cursorPosition: Math.max(0, Math.min(pos, prev.expression.length)),
      isNewNumber: false,
    }))
  }, [])

  return {
    ...state,
    appendDigit,
    appendOperator,
    appendDecimal,
    applyPercent,
    evaluate,
    clear,
    backspace,
    reset,
    setCursorPosition,
  }
}
