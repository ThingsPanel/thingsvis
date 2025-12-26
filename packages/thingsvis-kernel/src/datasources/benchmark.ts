import { SafeExecutor } from '../sandbox/SafeExecutor';

/**
 * Benchmark script for SC-005: JS Sandbox performance with 1MB JSON.
 */
export function runSandboxBenchmark() {
  // Generate ~1MB JSON
  const largeData = {
    items: Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      value: Math.random() * 100,
      tags: ['a', 'b', 'c']
    }))
  };

  const code = 'return data.items.filter(i => i.value > 50).map(i => i.id);';
  
  console.log('[Benchmark] Starting SC-005 validation (1MB JSON < 10ms)...');
  
  const start = performance.now();
  const result = SafeExecutor.execute(code, largeData);
  const end = performance.now();
  
  const duration = end - start;
  console.log(`[Benchmark] Execution completed in ${duration.toFixed(2)}ms`);
  console.log(`[Benchmark] Filtered ${result.length} items`);

  if (duration < 10) {
    console.log('✅ SC-005 PASSED: Execution time is under 10ms.');
  } else {
    console.warn('❌ SC-005 FAILED: Execution time exceeded 10ms.');
  }
}

