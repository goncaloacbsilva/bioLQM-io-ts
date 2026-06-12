export interface IndexMapper {
  get(idx: number): number;
}

class SimpleMapper implements IndexMapper {
  constructor(private readonly map: Map<number, number>) {}

  get(idx: number): number {
    return this.map.get(idx) ?? idx;
  }
}

export function getSimpleMapper(map: Map<number, number>): IndexMapper {
  return new SimpleMapper(map);
}
