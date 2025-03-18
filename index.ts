import { truncateStringify, stringifyWithLimit } from "./lib";

const file = Bun.file("data.json");
const json = await file.json();



// Utility to compute stats
function computeStats(times: number[]) {
  const min = Math.min(...times);
  const max = Math.max(...times);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const stdDev = Math.sqrt(
    times.reduce((a, b) => a + (b - avg) ** 2, 0) / times.length
  );
  return { min, max, avg, stdDev };
}

// Runs the given function repeatedly and returns an array of timings
function runPerformanceTest(fn: (arg0: object) => any, data: object, iterations = 100) {
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn(data);
    const end = performance.now();
    times.push(end - start);
  }
  return times;
}

// Warm up (optional, can help if there's overhead from JIT, GC, etc.)
truncateStringify(json);
JSON.stringify(json);
stringifyWithLimit(json);

// Number of times to run each test
const ITERATIONS = 1000;

// Collect times
const defaultTimes = runPerformanceTest(JSON.stringify, json, ITERATIONS);
const customTimes1 = runPerformanceTest(truncateStringify, json, ITERATIONS);
const customTimes2 = runPerformanceTest(stringifyWithLimit, json, ITERATIONS);

// Compute stats
const defaultStats = computeStats(defaultTimes);
const customStats1 = computeStats(customTimes1);
const customStats2 = computeStats(customTimes2);

// Display results
console.log("Default JSON.stringify Stats:");
console.log(`  Min:     ${defaultStats.min.toFixed(4)} ms`);
console.log(`  Max:     ${defaultStats.max.toFixed(4)} ms`);
console.log(`  Avg:     ${defaultStats.avg.toFixed(4)} ms`);
console.log(`  StdDev:  ${defaultStats.stdDev.toFixed(4)} ms\n`);

console.log("Custom truncateStringify Stats:");
console.log(`  Min:     ${customStats1.min.toFixed(4)} ms`);
console.log(`  Max:     ${customStats1.max.toFixed(4)} ms`);
console.log(`  Avg:     ${customStats1.avg.toFixed(4)} ms`);
console.log(`  StdDev:  ${customStats1.stdDev.toFixed(4)} ms\n`);

console.log("Custom stringifyWithLimit Stats:");
console.log(`  Min:     ${customStats2.min.toFixed(4)} ms`);
console.log(`  Max:     ${customStats2.max.toFixed(4)} ms`);
console.log(`  Avg:     ${customStats2.avg.toFixed(4)} ms`);
console.log(`  StdDev:  ${customStats2.stdDev.toFixed(4)} ms\n`);


