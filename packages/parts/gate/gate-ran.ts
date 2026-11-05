// Counts how many stories the parts gate hook has handled in this test file
// (a gate nobody can see run is not a gate). The preview afterEach
// bumps it; the vitest setup file's afterAll fails a file where it stayed at
// zero. Both are bundled into the same browser module graph per test file, so
// a plain module variable is shared between them.
let ran = 0;

export function markGateRan(): void {
  ran += 1;
}

export function gateRunCount(): number {
  return ran;
}
