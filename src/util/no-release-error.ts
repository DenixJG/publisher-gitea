export class NoReleaseError extends Error {
  code: number;

  constructor(code: number) {
    super(`No release found with code ${code}`);
    this.code = code;
    this.name = "NoReleaseError";
  }
}
