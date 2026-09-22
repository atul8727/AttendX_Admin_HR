export function mockDelay(data, delay = 350) {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), delay))
}
