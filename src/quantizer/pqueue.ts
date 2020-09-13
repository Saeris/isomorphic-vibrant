export interface PQueueComparator<T> {
  (a: T, b: T): number
}

export class PQueue<T> {
  contents: T[] = []
  #sorted: boolean = false
  #comparator: PQueueComparator<T>
  #sort = (): void => {
    if (!this.#sorted) {
      this.contents.sort(this.#comparator)
      this.#sorted = true
    }
  }

  constructor(comparator: PQueueComparator<T>) {
    this.#comparator = comparator
  }

  push(item: T): void {
    this.contents.push(item)
    this.#sorted = false
  }

  peek(index?: number): T {
    this.#sort()
    return this.contents[
      typeof index === `number` ? index : this.contents.length - 1
    ]
  }

  pop(): T {
    this.#sort()
    return this.contents.pop()!
  }

  size(): number {
    return this.contents.length
  }

  map<U>(mapper: (item: T, index: number) => any): U[] {
    this.#sort()
    return this.contents.map(mapper)
  }
}
