/**
 * A problem with the content itself (bad frontmatter, missing image) rather
 * than with the code. The message names the file, and is shown as-is in the
 * terminal, the dev error overlay and the CI log.
 */
export class ContentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ContentError'
  }
}
