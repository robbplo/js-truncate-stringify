import { JsonStreamStringify } from 'json-stream-stringify';
import { console } from 'node:inspector/promises';
import { Writable} from "node:stream";

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

function streamerReplacer(key: string, value: any) {
  if (typeof value === 'string') {
    return value.slice(0, 256) + '...truncated..."';
  }
  return value
}


// async function* outWrite(source: any) {
//   console.log(source)
// }

// class MyWriter extends Writable {
//   remaining = 0;
//   bufferx = "";

//   write(chunk: unknown, encoding?: unknown, callback?: unknown): boolean {
//     if (this.remaining < 0) {
//       // console.log(this.buffer)
//       console.log('done')
//       // no write
//       return true
//     } else {
//       let size  = (chunk as any).length;
//       this.remaining -= size;
  
//       this.bufferx += chunk as string;
  
//       return true
//     }
//   }
// }

// export async function stringifyWithStreamer(value: any, maxSize = MAX_SIZE) {
//   // let writer = JSONStream.stringify();

//   // writer.write("hallo")
//   // writer.write("hallo")
//   // writer.write("hallo")
//   // writer.write("hallo")
//   // writer.write("hallo")

//   // console.log(writer.flush())
//   const outWrite = new MyWriter();
//   outWrite.remaining = 1000;
//   outWrite.on('pipe', (src) => {
//     console.log('Something is piping into the writer.');
//   });

//   const going = new JsonStreamStringify(value, streamerReplacer)
//   going.on('data', (x) => {
//     // console.log(x)

//   })
//   // going.pipe(process.stdout);
//   // going.pipe(outWrite)

//   // console.log(outWrite)
//   let out: string = await new Promise(resolve => {
//     outWrite.on('finish', () => {
//       resolve(outWrite.bufferx)
//     })
//     going.pipe(outWrite)
//   })

//   console.log(out)

//   return out
// }

function scoreType(value: any): number {
  if (typeof value === 'number') {
    return 8;
  } else if (typeof value ==='string') {
    return 2 + value.length;
  } else if (typeof value ==='boolean') {
    return 4;
  } else if (Array.isArray(value)) {
    return NaN;
  } else if (typeof value === 'object') {
    return NaN;
  } else if (value === null) {
    return 4;
  } else if (typeof value === 'undefined') {
    return 0;
  } else {
    throw new Error('Unknown type');
  }
}

type Context = {
  remaining: number;
}

function _stringifyUpdateObject(value: Record<string, any>, context: Context): Record<string, any> {
  let out = Object.entries(value).reduce((acc, [key, val]) => {
    if (typeof val === 'object') {
      val = _stringifyUpdateObject(val, context)
    } else {
      let score = scoreType(key) + scoreType(val);
      if (score) {
        context.remaining -= score;
        if (context.remaining < 0) {
          return acc
        }
      }
    }
    acc[key] = val;
    return acc;
  }, {} as Record<string, any>);


  // console.log(out)
  return out
}

export function stringifyUpdateObject(value: Record<string, any>, maxSize = MAX_SIZE) {
  // console.log(JSON.stringify(value).length)
  let out = _stringifyUpdateObject(value, {remaining: maxSize})

  // console.log(out)
  // console.log(JSON.stringify(out))
  return JSON.stringify(out)
}