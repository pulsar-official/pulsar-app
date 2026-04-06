declare module 'animejs' {
  interface AnimeParams {
    targets?: any
    duration?: number
    delay?: number
    endDelay?: number
    easing?: string
    round?: boolean | number
    autoplay?: boolean
    loop?: boolean | number
    direction?: 'normal' | 'reverse' | 'alternate'
    [key: string]: any
  }

  interface AnimeInstance {
    play(): void
    pause(): void
    restart(): void
    reverse(): void
    seek(progress: number): void
    tick(now: number): void
    progress(value?: number): number
    reset(): void
  }

  function anime(params: AnimeParams): AnimeInstance

  namespace anime {
    function set(targets: any, value: any): AnimeInstance
    function timeline(params?: any): AnimeInstance
    function random(min: number, max: number): number
    function remove(targets: any): void
    function getValue(target: any, prop: string): any
    function convertValue(value: any, unit?: string): any
    function path(path: string | SVGPathElement, arg?: any): (progress: number) => any
    function setDashoffset(el: SVGElement): void
  }

  export default anime
}
