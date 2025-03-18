import { truncateStringify, stringifyWithLimit, nativeStringifyClosed } from "./lib";


const file = Bun.file("./many-small-strings.json");
const json = await file.json();

// const result = stringifyWithLimit(json)
//const result = nativeStringify(json)
const object = {
  "some\'\"ting": "\{\}\[\}][[\\\[]]]{{{{{}}}}}}}}{}{][]\\{}\"",
  "1": "\{\}\[\}][[\\\[]]]{{{{{}}}}}}}}{}{][]\\{}\"",
  "2": "\{\}\[\}][[\\\[]]]{{{{{}}}}}}}}{}{][]\\{}\""
}
const string = JSON.stringify(object)

for (let i = 2; i < string.length; i++) {
  let result = nativeStringifyClosed(object, i)
  console.log(result)
  JSON.parse(result)
}
