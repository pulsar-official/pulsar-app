declare module '@georgedoescode/spline' {
  export class Spline {
    constructor(points: Array<[number, number]>)
    getPoints(resolution: number): Array<[number, number]>
  }
}
