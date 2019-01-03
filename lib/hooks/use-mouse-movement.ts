import { useCallback, useRef } from 'react'

export default function useMouseMovement(
  onMove: (
    event: React.MouseEvent<any> & { movementX: number; movementY: number },
  ) => any,
  onMouseUp?: (event: React.MouseEvent<any>) => any,
) {
  const callbackRef = useRef<any>(onMove)
  const callbackUpRef = useRef<any>(onMouseUp)
  const contextRef = useRef<any>(undefined)

  if (onMove !== callbackRef.current) {
    callbackRef.current = onMove
  }

  if (onMouseUp !== callbackUpRef.current) {
    callbackUpRef.current = onMouseUp
  }

  const onMouseMove = event => {
    callbackRef.current(event, contextRef.current)
  }

  const handleMouseUp = event => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)

    if (callbackUpRef.current) {
      callbackUpRef.current(event)
    }
  }

  return useCallback(
    context => {
      if (contextRef.current !== context) {
        contextRef.current = context
      }
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [callbackRef.current],
  )
}
