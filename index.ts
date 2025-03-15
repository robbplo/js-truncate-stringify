const file = Bun.file("data.json");
const json = await file.json();

const MAX_SIZE = 10000;

function truncateStringify(data) {
  let acc = 0;
  const truncated = JSON.stringify(data, (key, value) => {
    if (typeof value === 'number') {
      acc += 8;
    }
    if (typeof value === 'string') {
      acc += value.length;
    }
    if (acc < MAX_SIZE) {
      return value;
    }
    // Return empty object once max size is reached
    if (typeof value === 'object') {
      return {}
    }
    // Returning undefined deletes the key
    // This does not work for objects
    return undefined
  });
  return truncated;
}

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
function runPerformanceTest(fn, data, iterations = 100) {
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
const result = truncateStringify(json);
JSON.stringify(json);

// Number of times to run each test
const ITERATIONS = 1000;

// Collect times
const defaultTimes = runPerformanceTest(JSON.stringify, json, ITERATIONS);
const customTimes = runPerformanceTest(truncateStringify, json, ITERATIONS);

Bun.write('out.json', result)

// Compute stats
const customStats = computeStats(customTimes);
const defaultStats = computeStats(defaultTimes);

// Display results
console.log("Custom truncateStringify Stats:");
console.log(`  Min:     ${customStats.min.toFixed(4)} ms`);
console.log(`  Max:     ${customStats.max.toFixed(4)} ms`);
console.log(`  Avg:     ${customStats.avg.toFixed(4)} ms`);
console.log(`  StdDev:  ${customStats.stdDev.toFixed(4)} ms\n`);

console.log("Default JSON.stringify Stats:");
console.log(`  Min:     ${defaultStats.min.toFixed(4)} ms`);
console.log(`  Max:     ${defaultStats.max.toFixed(4)} ms`);
console.log(`  Avg:     ${defaultStats.avg.toFixed(4)} ms`);
console.log(`  StdDev:  ${defaultStats.stdDev.toFixed(4)} ms\n`);

