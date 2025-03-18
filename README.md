## Truncate-stringify comparison

This is a quick project that compares a custom "truncateStringify" function to the default `JSON.stringify`. The custom function tracks how much numeric and string data it has serialized and stops if it reaches a certain size. We run each function multiple times, record how long they take, and then calculate min, max, average, and standard deviation.

### Usage

1. Make sure [Bun](https://bun.sh/) is installed
2. Run the script:
   ```bash
   bun run matrix.ts
   ```
3. Check your console for timing stats

### Results
Each function is tested with different kinds of files. Some are large, some are small. Refer to the
files in the repo. The following results are with a limit of 10kb
```
Matrix of average runtimes (ms) with relative performance:
┌─────────────────────────┬───────────────────┬───────────────────┬────────────────────┐
│                         │ JSON.stringify    │ truncateStringify │ stringifyWithLimit │
├─────────────────────────┼───────────────────┼───────────────────┼────────────────────┤
│ many-large-strings.json │ 0.3603 ms (1.00x) │ 0.0827 ms (0.23x) │ 0.0164 ms (0.05x)  │
│ many-small-strings.json │ 1.0136 ms (1.00x) │ 4.1753 ms (4.12x) │ 1.2037 ms (1.19x)  │
│   small-collection.json │ 0.0044 ms (1.00x) │ 0.0184 ms (4.19x) │ 0.0322 ms (7.31x)  │
│       single-digit.json │ 0.0001 ms (1.00x) │ 0.0005 ms (4.57x) │ 0.0002 ms (1.55x)  │
│       small-string.json │ 0.0001 ms (1.00x) │ 0.0004 ms (5.62x) │ 0.0007 ms (10.11x) │
└─────────────────────────┴───────────────────┴───────────────────┴────────────────────┘
```
The stringifyWithLimit function is only faster for the first case, which contains 1kb large strings
inside of a collection. Simply stringifying the result and then taking the slice of 10kb is fastest
in most situations.

### Config

- **MAX_SIZE** – How much data gets serialized before truncation, attempts to estimate byte size of
the final result
- **ITERATIONS** – How many times each function is tested for timing

