import { LanguageDescription, LanguageSupport, StreamLanguage, type StreamParser } from '@codemirror/language';

// Minimal Move language grammar for syntax highlighting in CodeMirror
// Keywords based on Move: module, struct, fun, public, entry, has, key, store, drop, copy
const moveKeywords = new Set(['module', 'struct', 'fun', 'public', 'entry', 'has', 'key', 'store', 'drop', 'copy']);

type MoveState = {
  inBlockComment: boolean;
  stringDelimiter: '"' | '\'' | null;
};

const moveParser: StreamParser<MoveState> = {
  startState() {
    return { inBlockComment: false, stringDelimiter: null };
  },
  token(stream, state) {
    if (state.inBlockComment) {
      if (stream.skipTo('*/')) {
        stream.match('*/');
        state.inBlockComment = false;
      } else {
        stream.skipToEnd();
      }
      return 'comment';
    }

    if (state.stringDelimiter) {
      let escaped = false;
      while (!stream.eol()) {
        const ch = stream.next();
        if (!escaped && ch === state.stringDelimiter) {
          state.stringDelimiter = null;
          break;
        }
        escaped = !escaped && ch === '\\';
      }
      return 'string';
    }

    if (stream.eatSpace()) {
      return null;
    }

    if (stream.match('//')) {
      stream.skipToEnd();
      return 'comment';
    }

    if (stream.match('/*')) {
      state.inBlockComment = true;
      return 'comment';
    }

    const delim = stream.peek();
    if (delim === '"' || delim === '\'') {
      state.stringDelimiter = stream.next() as '"' | '\'';
      return 'string';
    }

    if (stream.match(/0x[0-9a-fA-F]+\b/)) {
      return 'number';
    }

    if (stream.match(/\b\d+(?:_\d+)*(?:\.\d+)?\b/)) {
      return 'number';
    }

    if (stream.match(/[{}()[\],.;]/)) {
      return null;
    }

    if (stream.match(/[A-Za-z_]\w*/)) {
      const word = stream.current();
      if (moveKeywords.has(word)) return 'keyword';
      return 'variableName';
    }

    stream.next();
    return null;
  },
};

const moveLanguage = new LanguageSupport(StreamLanguage.define(moveParser));

export const moveLanguageDescription = LanguageDescription.of({
  name: 'Move',
  extensions: ['move'],
  async load() {
    // Return the language support when requested
    return moveLanguage;
  },
});
