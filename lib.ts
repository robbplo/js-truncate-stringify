const MAX_SIZE = 10000;

export function nativeStringify(data: object, maxSize = MAX_SIZE) {
  return JSON.stringify(data).slice(0, maxSize)
}
//export function nativeStringifyClosed(data: object, maxSize = MAX_SIZE) {
//  const jsonStr = JSON.stringify(data).slice(0, maxSize);
//  let stack = [];            // Stack to track open brackets/braces.
//  let inString = false;      // Are we inside a string literal?
//  let escape = false;        // Was the previous character a backslash?
//  let resultChars = [];      // Accumulate characters for the output.
//
//  // Process character by character up to maxSize (or end of string).
//  let i = 0;
//  for (; i < maxSize && i < jsonStr.length; i++) {
//    const char = jsonStr[i];
//    resultChars.push(char);
//
//    if (inString) {
//      if (escape) {
//        escape = false;
//      } else if (char === '\\') {
//        escape = true;
//      } else if (char === '"') {
//        inString = false;
//      }
//    } else {
//      if (char === '"') {
//        inString = true;
//      } else if (char === '{' || char === '[') {
//        stack.push(char);
//      } else if (char === '}' || char === ']') {
//        // Pop from stack if it matches the expected opener.
//        if (stack.length > 0) {
//          const last = stack[stack.length - 1];
//          if ((char === '}' && last === '{') || (char === ']' && last === '[')) {
//            stack.pop();
//          }
//        }
//      }
//    }
//  }
//
//  let truncated = resultChars.join('');
//
//  // (Optional) Remove a trailing comma if one exists.
//  truncated = truncated.replace(/,\s*$/, '');
//
//  // If we ended in the middle of a string literal, append the closing quote.
//  if (inString) {
//    truncated += '"';
//  }
//
//  // Append closing tokens for any open structures.
//  while (stack.length > 0) {
//    const opener = stack.pop();
//    truncated += opener === '{' ? '}' : ']';
//  }
//
//  // (Optional) Remove any trailing partial token (e.g. dangling number/word)
//  if (!inString) {
//    truncated = truncated.replace(/[0-9a-zA-Z]+$/, '');
//  }
//
//  // Remove an incomplete object key if present.
//  truncated = removeIncompleteObjectKey(truncated);
//
//  return truncated;
//}

export function nativeStringifyClosed(data: object, maxSize = MAX_SIZE) {
  let result = JSON.stringify(data).slice(0, maxSize)
  if (result.length < maxSize) {
    return result
  }
  let bracketStack = []
  let inString = false;
  let inKey = false;
  let afterKey = false;
  for (let i = 0; i < result.length; i++) {
    switch (result[i]) {
      case '\\': i += 1
        break
      case '"':
        inString = !inString
        // if in object
        if (bracketStack[bracketStack.length - 1] == '}') {
          if (afterKey) {
            continue
          } else {
            if (inKey) {
              inKey = false
              afterKey = true
            } else {
              inKey = true
            }
          }
        }
        continue
      case ',':
        if (bracketStack[bracketStack.length - 1] == '}') {
          if (!inString) {
            inKey = false
            afterKey = false
          }
        }
        break
      case '[':
        if (!inString) {
          bracketStack.push(']')
        }
        break
      case '{':
        if (!inString) {
          afterKey = false
          bracketStack.push('}')
        }
        break
      case ']':
        if (!inString) {
          bracketStack.pop()
        }
        break
      case '}':
        if (!inString) {
          bracketStack.pop()
        }
        break
    }
  }
  if (bracketStack[bracketStack.length - 1] == '}') {
    for (let i = result.length - 1; i >= 0; i--) {
      if (result[i] == ':') {
        result = result.slice(0, i + 1) + '"'
        inString = true
        break
      } else if (result[i] == '{' || result[i] == ',') {
        result = result.slice(0, i + 1)
        break
      }
    }
  }
  if (result[result.length - 1] == '\\') {
    result += '\\'
  }
  if (inString && afterKey) {
    result += '...truncated..."'
  }

  bracketStack.forEach((bracket) => { result += bracket })
  return result
}

export function truncateStringify(data: object, maxSize = MAX_SIZE) {
  const result = JSON.stringify(data)
  if (result.length < maxSize) {
    return result
  }
  return stringifyWithLimit(data)
}

export function stringifyWithLimit(value: object, maxSize = MAX_SIZE) {
  let output = '';
  let bracketStack: string[] = []

  function append(str: string) {
    if (output.length + str.length > maxSize) {
      // Enough room for only part of `str`
      let available = maxSize - output.length;
      output += str.slice(0, available) + '...truncated..."';
      // We can either throw an error to bail out entirely or store a flag
      bracketStack.forEach((bracket) => {
        output += bracket
      })

      throw new Error('__truncated__');
    }
    output += str;
  }

  function build(val: any) {
    if (val === null) {
      append('null');
    } else if (typeof val === 'string') {
      append(JSON.stringify(val)); // let native JSON.stringify handle quotes
    } else if (typeof val === 'number' || typeof val === 'boolean') {
      append(String(val));
    } else if (Array.isArray(val)) {
      append('[');
      bracketStack.push(']')
      for (let i = 0; i < val.length; i++) {
        if (i > 0) append(',');
        build(val[i]);
      }
      append(']');
      bracketStack.pop()
    } else if (typeof val === 'object') {
      append('{');
      bracketStack.push('}')
      let first = true;
      for (const k in val) {
        if (!Object.hasOwn(val, k)) continue;
        if (!first) append(',');
        append(JSON.stringify(k)); // key in quotes
        append(':');
        build(val[k]);
        first = false;
      }
      append('}');
      bracketStack.pop()
    } else {
      // Functions, symbols, etc. become null in standard JSON.
      append('null');
    }
  }

  try {
    build(value);
  } catch (err) {
    if (err.message !== '__truncated__') throw err;
  }
  return output;
}

