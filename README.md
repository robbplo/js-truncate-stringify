## Truncate-stringify comparison

This is a quick project that compares a custom "truncateStringify" function to the default `JSON.stringify`. The custom function tracks how much numeric and string data it has serialized and stops if it reaches a certain size. We run each function multiple times, record how long they take, and then calculate min, max, average, and standard deviation.

### Usage

1. Make sure [Bun](https://bun.sh/) is installed
2. Place your data in `data.json`
3. Run the script:
   ```bash
   bun run index.js
   ```
4. Check your console for timing stats

### Results
The provided JSON file contains 1000 objects with 1kb of base64 encoded data each.
```
Custom truncateStringify Stats:
  Min:     0.0530 ms
  Max:     0.5978 ms
  Avg:     0.0748 ms
  StdDev:  0.0282 ms

Default JSON.stringify Stats:
  Min:     0.1353 ms
  Max:     1.4020 ms
  Avg:     0.2159 ms
  StdDev:  0.1514 ms
```
In this particular instance, we observe a ~3x speed increase by truncating the JSON.

### Config

- **MAX_SIZE** – How much data gets serialized before truncation, attempts to estimate byte size of
the final result
- **ITERATIONS** – How many times each function is tested for timing

