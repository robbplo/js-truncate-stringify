import { nativeStringify, truncateStringify, stringifyWithLimit, nativeStringifyClosed, stringifyUpdateObject } from "./lib";

// Number of iterations per test
const ITERATIONS = 300;

// Utility to compute stats
function computeStats(times) {
  const min = Math.min(...times);
  const max = Math.max(...times);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const stdDev = Math.sqrt(
    times.reduce((a, b) => a + (b - avg) ** 2, 0) / times.length
  );
  return { min, max, avg, stdDev };
}

// Runs the given function repeatedly and returns an array of timings
function runPerformanceTest(fn, data, iterations = ITERATIONS) {
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn(data);
    const end = performance.now();
    times.push(end - start);
  }
  return times;
}

// List of benchmark functions with display names
const functionList = [
  { name: "JSON.stringify", fn: nativeStringify },
  { name: "JSON.stringify closed", fn: nativeStringifyClosed },
  { name: "truncateStringify", fn: truncateStringify },
  { name: "stringifyWithLimit", fn: stringifyWithLimit },
  { name: "stringifyUpdateObject", fn: stringifyUpdateObject },
];

// List of files to benchmark (add as many as needed)
const fileNames = [
  "many-large-strings.json",
  "many-small-strings.json",
  "small-collection.json",
  "single-digit.json",
  "small-string.json",
  "strings-array.json",
];

// Object to store results in a matrix form (file -> function -> formatted average runtime)
const results = {};

for (const fileName of fileNames) {
  // Load file and parse JSON
  const file = Bun.file(fileName);
  const json = await file.json();

  // Warm-up each function on this file (optional but recommended)
  for (const { fn } of functionList) {
    for (let warmup = 0; warmup < ITERATIONS; warmup++) {
      fn(json);
    }
  }

  // Temporary storage for averages for this file
  const averages = {};

  for (const { name, fn } of functionList) {
    const times = runPerformanceTest(fn, json, ITERATIONS);
    const stats = computeStats(times);
    averages[name] = stats.avg;
  }

  // Use the first function's average as the baseline for relative performance
  const baseAvg = averages[functionList[0].name];
  results[fileName] = {};

  // Build output string: "avg ms (relative x)", where relative = avg / baseAvg
  for (const { name } of functionList) {
    const avg = averages[name];
    const relative = avg / baseAvg;
    results[fileName][name] = `${avg.toFixed(4)} ms (${relative.toFixed(2)}x)`;
  }
}

// Display the matrix of average runtimes with relative performance
console.log("Matrix of average runtimes (ms) with relative performance:");
console.table(results);

