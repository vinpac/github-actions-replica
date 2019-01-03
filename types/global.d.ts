declare module '*.json'
declare module 'astroturf' {
  export type Stylesheet<K extends string> = { [P in K]: string }

  export const css: (
    template: TemplateStringsArray,
    ...args: Array<string | number>
  ) => any
}

declare module 'classnames' {
  const cx: (...classNames: any[]) => string

  export default cx
}
