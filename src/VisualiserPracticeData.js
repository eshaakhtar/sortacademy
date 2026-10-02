// src/visualiserPracticeData.js

// ------------------------ Helpers ------------------------

// Clamp a number between a minimum (a) and maximum (b)
export function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }
  
  // Parse user input (e.g., "5, 3, 8") into an array of numbers
  export function parseInputArray(input) {
    if (!input.trim()) return null;
    const parts = input.split(/[, ]+/).filter(Boolean);
    const nums = parts.map((p) => Number(p));
    if (nums.some((n) => Number.isNaN(n))) return null;
    return nums;
  }
  
  // Generate a random array of given size within a range
  export function makeRandomArray(size, min = 5, max = 99) {
    const arr = [];
    for (let i = 0; i < size; i++) {
      arr.push(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    return arr;
  }
  
  // Generate a reversed (descending) array
  export function makeReversedArray(size) {
    const arr = makeRandomArray(size);
    return [...arr].sort((a, b) => b - a);
  }
  
  // Generate a nearly sorted array with a few random swaps
  export function makeNearlySortedArray(size) {
    const arr = makeRandomArray(size).sort((a, b) => a - b);
    const swaps = Math.max(1, Math.floor(size / 5));
    for (let s = 0; s < swaps; s++) {
      const i = Math.floor(Math.random() * size);
      const j = Math.floor(Math.random() * size);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  
  // Generate array with duplicates (useful for testing stability)
  export function makeDuplicatesArray(size) {
    const base = makeRandomArray(size, 1, 20);
    return base.map((x) => (x % 5) * 5 + 5);
  }
  
  // Push a snapshot ("step") of the algorithm state into steps array
  function pushStep(steps, arr, ctx) {
    steps.push({
      array: [...arr],
      highlight: ctx.highlight || {},
      sorted: ctx.sorted ? [...ctx.sorted] : [],
      message: ctx.message || "",
      why: ctx.why || "",
      comparisons: ctx.comparisons ?? 0,
      writes: ctx.writes ?? 0,
      actionHint: ctx.actionHint || { type: "none", indices: [] },
      codeLine: ctx.codeLine ?? 0,
    });
  }
  
  // ------------------------ Step generators ------------------------
  
// ---------------- Bubble Sort ----------------
// Includes optimisation: early exit if no swaps occur
  export function bubbleSteps(initial) {
    const arr = [...initial];
    const steps = [];
    let comparisons = 0;
    let writes = 0;
    const sorted = new Set();
  
    // Initial explanation step
    pushStep(steps, arr, {
      message: "Start Bubble Sort: compare adjacent items and swap if out of order.",
      why: "Bubble repeatedly pushes the largest remaining value to the end each pass.",
      comparisons,
      writes,
      codeLine: 1,
    });
  
     // Outer loop shrinks unsorted portion from the end
    for (let end = arr.length - 1; end > 0; end--) {
      let swappedThisPass = false; 
  
      for (let i = 0; i < end; i++) {
        comparisons++;
        const a = arr[i];
        const b = arr[i + 1];
  
         // Comparison step
        pushStep(steps, arr, {
          highlight: { compare: [i, i + 1] },
          message: `Compare positions ${i} and ${i + 1}.`,
          why: `We check if ${a} > ${b}. If yes, swap to move the larger right.`,
          comparisons,
          writes,
          actionHint: { type: "none", indices: [] },
          codeLine: 3,
        });
  
        // Swap if needed
        if (a > b) {
          [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
          swappedThisPass = true; 
          writes++;
  
          pushStep(steps, arr, {
            highlight: { swap: [i, i + 1] },
            message: "Swap because the left value is larger.",
            why: `${a} > ${b}, so swapping moves the larger value one step toward the end.`,
            comparisons,
            writes,
            actionHint: { type: "swap", indices: [i, i + 1] },
            codeLine: 4,
          });
        }
      }
  
      // Mark last element as sorted
      sorted.add(end);
      pushStep(steps, arr, {
        sorted: Array.from(sorted),
        message: `Position ${end} is now fixed (largest bubbled to the end).`,
        why: "After one full pass, the largest remaining value must be at the end.",
        comparisons,
        writes,
        codeLine: 1,
      });
  
      // Early exit optimisation
      if (!swappedThisPass) {
        // mark everything left as sorted for clarity
        for (let k = 0; k < end; k++) sorted.add(k);
  
        pushStep(steps, arr, {
          sorted: Array.from(sorted),
          message: "No swaps in this pass → array is already sorted. Early exit!",
          why: "If a full pass makes no swaps, the array must be in order.",
          comparisons,
          writes,
          codeLine: 1,
        });
        break;
      }
    }
  
    // finish
    for (let i = 0; i < arr.length; i++) sorted.add(i);
  
    pushStep(steps, arr, {
      sorted: Array.from(sorted),
      message: "Done! Array is sorted.",
      why: "All positions are fixed from left to right.",
      comparisons,
      writes,
      codeLine: 0,
    });
  
    return steps;
  }
  
  // ---------------- Insertion Sort ----------------
// Builds sorted prefix by inserting elements
  export function insertionSteps(initial) {
    const arr = [...initial];
    const steps = [];
    let comparisons = 0;
    let writes = 0;
  
    // Initial explanatory step
    pushStep(steps, arr, {
      sorted: [0],
      message: "Start Insertion Sort: grow a sorted prefix by inserting the next item.",
      why: "Insertion is fast when the array is already nearly sorted.",
      comparisons,
      writes,
      codeLine: 1,
    });
  
    // Start from the second element, treating index 0 as a sorted prefix of length 1
    for (let i = 1; i < arr.length; i++) {
      const key = arr[i];
      let j = i - 1;
  
     // Explain which key is being inserted
      pushStep(steps, arr, {
        sorted: Array.from({ length: i }, (_, k) => k),
        highlight: { compare: [i] },
        message: `Take key = ${key} (index ${i}). Insert it into sorted prefix [0…${i - 1}].`,
        why: "We pull out the next value (key) and shift larger values right until we find its position.",
        comparisons,
        writes,
        codeLine: 2,
      });
  
       // Scan backwards through the sorted prefix
      while (j >= 0) {
        comparisons++;
        const leftVal = arr[j];
  
        pushStep(steps, arr, {
          sorted: Array.from({ length: i }, (_, k) => k),
          highlight: { compare: [j, j + 1] },
          message: `Compare key (${key}) with ${leftVal} at index ${j}.`,
          why: `If ${leftVal} > ${key}, we shift ${leftVal} right to open a gap.`,
          comparisons,
          writes,
          codeLine: 3,
        });
  
       // Shift larger values one place to the right
        if (leftVal > key) {
          arr[j + 1] = leftVal;
          writes++;
          pushStep(steps, arr, {
            sorted: Array.from({ length: i }, (_, k) => k),
            highlight: { swap: [j + 1] },
            message: `Shift ${leftVal} right into index ${j + 1}.`,
            why: "Shifting preserves order in the sorted prefix while making space for the key.",
            comparisons,
            writes,
            actionHint: { type: "write", indices: [j + 1] },
            codeLine: 4,
          });
          j--;
        } else break;
      }
  
      // Insert the key into its correct position
      arr[j + 1] = key;
      writes++;
  
      const prefix = Array.from({ length: i + 1 }, (_, k) => k);
      pushStep(steps, arr, {
        sorted: prefix,
        highlight: { swap: [j + 1] },
        message: `Place key (${key}) at index ${j + 1}. Prefix [0…${i}] is sorted.`,
        why: "The key is inserted into the correct position within the prefix.",
        comparisons,
        writes,
        actionHint: { type: "write", indices: [j + 1] },
        codeLine: 5,
      });
    }
  
     // Final state
    pushStep(steps, arr, {
      sorted: Array.from({ length: arr.length }, (_, i) => i),
      message: "Done! Array is sorted.",
      why: "The sorted prefix eventually grows to cover the whole array.",
      comparisons,
      writes,
      codeLine: 0,
    });
  
    return steps;
  }
  
 // ---------------- Selection Sort ----------------
 // Repeatedly finds the minimum from the unsorted region and fixes one position
  export function selectionSteps(initial) {
    const arr = [...initial];
    const steps = [];
    let comparisons = 0;
    let writes = 0;
    const fixed = new Set();
  
    // Initial explanation
    pushStep(steps, arr, {
      message: "Start Selection Sort: repeatedly select the smallest remaining item.",
      why: "Selection scans the remaining array to find the minimum, then places it into position i.",
      comparisons,
      writes,
      codeLine: 1,
    });
  
    // Each outer loop fixes exactly one final position
    for (let i = 0; i < arr.length; i++) {
      let minIdx = i;
  
      // Start by assuming the current position holds the minimum
      pushStep(steps, arr, {
        highlight: { compare: [i] },
        message: `Set minIdx = ${minIdx}.`,
        why: "Assume the first element of the unsorted region is the minimum, then try to beat it.",
        comparisons,
        writes,
        codeLine: 2,
      });
  
      // Scan the rest of the unsorted region to find the true minimum
      for (let j = i + 1; j < arr.length; j++) {
        comparisons++;
        pushStep(steps, arr, {
          highlight: { compare: [minIdx, j] },
          message: `Compare current min (idx ${minIdx}) with idx ${j}.`,
          why: `If arr[${j}] is smaller than arr[${minIdx}], update minIdx.`,
          comparisons,
          writes,
          codeLine: 3,
        });
  
        if (arr[j] < arr[minIdx]) {
          minIdx = j;
          pushStep(steps, arr, {
            highlight: { compare: [minIdx] },
            message: `New minimum found at index ${minIdx}.`,
            why: "We track the best (smallest) candidate seen so far.",
            comparisons,
            writes,
            codeLine: 4,
          });
        }
      }
  
      // Swap minimum into place if needed
      if (minIdx !== i) {
        const oldI = arr[i];
        const oldMin = arr[minIdx];
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        writes++;
        pushStep(steps, arr, {
          highlight: { swap: [i, minIdx] },
          message: `Swap the minimum into position ${i}.`,
          why: `We found minimum ${oldMin} at index ${minIdx}, so we swap it with ${oldI} at index ${i}.`,
          comparisons,
          writes,
          actionHint: { type: "swap", indices: [i, minIdx] },
          codeLine: 5,
        });
      } else {
       // No swap needed if the current position already has the minimum
        pushStep(steps, arr, {
          message: `No swap needed — minimum already at index ${i}.`,
          why: "Sometimes the smallest remaining value is already in the correct place.",
          comparisons,
          writes,
          codeLine: 5,
        });
      }
  
      // Mark this position as permanently fixed
      fixed.add(i);
      pushStep(steps, arr, {
        sorted: Array.from(fixed),
        message: `Position ${i} is now fixed.`,
        why: "Selection fixes one final position per outer loop.",
        comparisons,
        writes,
        codeLine: 6,
      });
    }
  
    // Final state
    pushStep(steps, arr, {
      sorted: Array.from({ length: arr.length }, (_, i) => i),
      message: "Done! Array is sorted.",
      why: "All positions have been fixed.",
      comparisons,
      writes,
      codeLine: 0,
    });
  
    return steps;
  }
  
// ---------------- Merge Sort ----------------
// Divide-and-conquer: recursively split, then merge sorted halves
  export function mergeSteps(initial) {
    const arr = [...initial];
    const steps = [];
    let comparisons = 0;
    let writes = 0;
  
    // Initial explanation
    pushStep(steps, arr, {
      message: "Start Merge Sort: split into halves and merge back in sorted order.",
      why: "Merge Sort is divide-and-conquer: split, sort, merge.",
      comparisons,
      writes,
      codeLine: 1,
    });
  
    function mergeSort(l, r) {
      if (l >= r) return; // base case: one element is already sorted
      const m = Math.floor((l + r) / 2);
  
      // Show the split step
      pushStep(steps, arr, {
        highlight: { range: [l, r] },
        message: `Split range [${l}, ${r}] at mid ${m}.`,
        why: "We split the problem into smaller subproblems until size 1.",
        comparisons,
        writes,
        codeLine: 2,
      });
  
      mergeSort(l, m);
      mergeSort(m + 1, r);
  
      // Copy both sorted halves before merging them back
      const left = arr.slice(l, m + 1);
      const right = arr.slice(m + 1, r + 1);
  
      let i = 0,
        j = 0,
        k = l;
  
      // Merge explanation step
      pushStep(steps, arr, {
        highlight: { range: [l, r] },
        message: `Merge two sorted halves into [${l}, ${r}].`,
        why: "We repeatedly take the smallest front element from left/right and write it back.",
        comparisons,
        writes,
        codeLine: 4,
      });
  
      // Compare fronts of both halves until one side runs out
      while (i < left.length && j < right.length) {
        comparisons++;
  
        const L = left[i];
        const R = right[j];
  
        pushStep(steps, arr, {
          highlight: { range: [l, r] },
          message: `Compare ${L} vs ${R}, then write smaller into index ${k}.`,
          why: "During merge, we compare the front items of the two halves.",
          comparisons,
          writes,
          codeLine: 5,
        });
  
        if (L <= R) arr[k] = left[i++];
        else arr[k] = right[j++];
  
        writes++;
        pushStep(steps, arr, {
          highlight: { range: [l, r], swap: [k] },
          message: `Write into index ${k}.`,
          why: "We write the next smallest element into the output position k.",
          comparisons,
          writes,
          actionHint: { type: "write", indices: [k] },
          codeLine: 6,
        });
        k++;
      }
  
      // Copy any remaining values from the left half
      while (i < left.length) {
        arr[k] = left[i++];
        writes++;
        pushStep(steps, arr, {
          highlight: { range: [l, r], swap: [k] },
          message: `Copy remaining left value into index ${k}.`,
          why: "If the right half is exhausted, copy the rest of the left half.",
          comparisons,
          writes,
          actionHint: { type: "write", indices: [k] },
          codeLine: 7,
        });
        k++;
      }
  
      // Copy any remaining values from the right half
      while (j < right.length) {
        arr[k] = right[j++];
        writes++;
        pushStep(steps, arr, {
          highlight: { range: [l, r], swap: [k] },
          message: `Copy remaining right value into index ${k}.`,
          why: "If the left half is exhausted, copy the rest of the right half.",
          comparisons,
          writes,
          actionHint: { type: "write", indices: [k] },
          codeLine: 7,
        });
        k++;
      }
  
      // Mark merged range as sorted
      pushStep(steps, arr, {
        highlight: { range: [l, r] },
        message: `Merged range [${l}, ${r}] is now sorted.`,
        why: "After merging, the range is fully sorted.",
        comparisons,
        writes,
        codeLine: 4,
      });
    }
  
    mergeSort(0, arr.length - 1);
  // Final state
    pushStep(steps, arr, {
      sorted: Array.from({ length: arr.length }, (_, i) => i),
      message: "Done! Array is sorted.",
      why: "All merges completed — the full array is sorted.",
      comparisons,
      writes,
      codeLine: 0,
    });
  
    return steps;
  }
  
  // ---------------- Quick Sort ----------------
// Partition around a pivot, then recursively sort both sides
  export function quickSteps(initial) {
    const arr = [...initial];
    const steps = [];
    let comparisons = 0;
    let writes = 0;
  
     // Initial explanation
    pushStep(steps, arr, {
      message: "Start Quick Sort: choose a pivot, partition, then recurse.",
      why: "Quick Sort partitions around a pivot, then sorts the two sides.",
      comparisons,
      writes,
      codeLine: 1,
    });
  
    // Partition helper: last item is used as pivot
    function partition(l, r) {
      const pivotVal = arr[r];
      let i = l;
  
      pushStep(steps, arr, {
        highlight: { pivot: r, range: [l, r] },
        message: `Pivot is arr[${r}] = ${pivotVal}. Partition [${l}, ${r}].`,
        why: "All values ≤ pivot will end up on the left side.",
        comparisons,
        writes,
        codeLine: 2,
      });
  
     // Scan the range and grow the ≤ pivot region
      for (let j = l; j < r; j++) {
        comparisons++;
  
        pushStep(steps, arr, {
          highlight: { compare: [j, r], pivot: r, range: [l, r] },
          message: `Compare arr[${j}] = ${arr[j]} with pivot ${pivotVal}.`,
          why: "If arr[j] ≤ pivot, it belongs in the left (≤ pivot) region.",
          comparisons,
          writes,
          codeLine: 3,
        });
  
        if (arr[j] <= pivotVal) {
          if (i !== j) {
            const ai = arr[i];
            const aj = arr[j];
            [arr[i], arr[j]] = [arr[j], arr[i]];
            writes++;
            pushStep(steps, arr, {
              highlight: { swap: [i, j], pivot: r, range: [l, r] },
              message: `Swap into the ≤ pivot region.`,
              why: `${aj} ≤ ${pivotVal}, so we move it into the left region by swapping with ${ai}.`,
              comparisons,
              writes,
              actionHint: { type: "swap", indices: [i, j] },
              codeLine: 4,
            });
          } else {
             // No swap needed if the value is already at the left-region boundary
            pushStep(steps, arr, {
              highlight: { compare: [j, r], pivot: r, range: [l, r] },
              message: `Accept arr[${j}] into ≤ pivot region (no swap).`,
              why: "It’s already at the boundary, so we just expand the left region.",
              comparisons,
              writes,
              codeLine: 4,
            });
          }
          i++;
        }
      }
  
      // Place pivot into its final sorted position
      const ai = arr[i];
      [arr[i], arr[r]] = [arr[r], arr[i]];
      writes++;
      pushStep(steps, arr, {
        highlight: { swap: [i, r], pivot: i, range: [l, r] },
        message: `Move pivot into final position at index ${i}.`,
        why: `Placing pivot splits the array: left ≤ pivot, right > pivot. (Swapped with ${ai})`,
        comparisons,
        writes,
        actionHint: { type: "swap", indices: [i, r] },
        codeLine: 5,
      });
  
      return i;
    }
  
    // Recursive Quick Sort helper
    function quickSort(l, r) {
      if (l >= r) return;
      const p = partition(l, r);
  
      pushStep(steps, arr, {
        highlight: { range: [l, r], pivot: p },
        message: `Pivot fixed at index ${p}. Recurse left and right.`,
        why: "Now we sort the two partitions independently.",
        comparisons,
        writes,
        codeLine: 6,
      });
  
      quickSort(l, p - 1);
      quickSort(p + 1, r);
    }
  
    quickSort(0, arr.length - 1);
  
     // Final state
    pushStep(steps, arr, {
      sorted: Array.from({ length: arr.length }, (_, i) => i),
      message: "Done! Array is sorted.",
      why: "All partitions sorted — the full array is sorted.",
      comparisons,
      writes,
      codeLine: 0,
    });
  
    return steps;
  }
  
  // Shared dispatcher used by the visualiser page
// Builds the correct step list for the selected algorithm
  export function buildStepsForAlgo(algoName, arr) {
    switch (algoName) {
      case "Bubble":
        return bubbleSteps(arr);
      case "Insertion":
        return insertionSteps(arr);
      case "Selection":
        return selectionSteps(arr);
      case "Merge":
        return mergeSteps(arr);
      case "Quick":
        return quickSteps(arr);
      default:
        return bubbleSteps(arr);
    }
  }
  
  // ------------------------ UI Pseudocode ------------------------

  // Short pseudocode snippets shown in the UI for each algorithm
  export const PSEUDOCODE = {
    Bubble: [
      "for end = n-1 downTo 1",
      "  for i = 0 to end-1",
      "    compare A[i], A[i+1]",
      "    if out of order: swap",
    ],
    Insertion: [
      "for i = 1 to n-1",
      "  key = A[i]",
      "  while j >= 0 and A[j] > key",
      "    shift A[j] right",
      "  place key at j+1",
    ],
    Selection: [
      "for i = 0 to n-1",
      "  minIdx = i",
      "  for j = i+1 to n-1",
      "    if A[j] < A[minIdx]: minIdx = j",
      "  swap A[i], A[minIdx]",
      "  i is fixed",
    ],
    Merge: [
      "mergeSort(l, r)",
      "  split at mid",
      "  sort left, sort right",
      "  merge halves",
      "  compare front items",
      "  write smallest to output",
      "  copy remaining",
    ],
    Quick: [
      "quickSort(l, r)",
      "  pivot = A[r]",
      "  partition: scan j",
      "  if A[j] <= pivot: swap/accept",
      "  swap pivot into place",
      "  pivot fixed",
      "  recurse left & right",
    ],
  };
  
  // ------------------------ Algorithm Insights ------------------------

  // Short summary text shown in the UI for each algorithm
  export const INSIGHTS = {
    Bubble: {
      summary:
        "Bubble Sort repeatedly compares adjacent items and swaps when out of order. Easy to understand, but slow for large datasets.",
      best: "Best for learning basics and very small arrays.",
      time: "O(n²) avg/worst · O(n) best (with early-exit optimisation)",
      space: "O(1)",
      note: "Many swaps; you’ll often see the right side become fixed first.",
    },
    Insertion: {
      summary:
        "Insertion Sort grows a sorted prefix. It inserts each new key into the correct place by shifting larger values right.",
      best: "Excellent for nearly-sorted data and small arrays.",
      time: "O(n²) avg/worst · O(n) best",
      space: "O(1)",
      note: "Green “sorted” means the prefix [0…i] is sorted (not final positions).",
    },
    Selection: {
      summary:
        "Selection Sort scans the unsorted region to find the minimum, then places it into position i. It fixes one final position each pass.",
      best: "Good for learning and when swaps are expensive to minimise swap count.",
      time: "O(n²) always",
      space: "O(1)",
      note: "Few swaps, but still many comparisons.",
    },
    Merge: {
      summary:
        "Merge Sort splits the array into halves, sorts each half, then merges them back together. Very reliable performance.",
      best: "Great general-purpose sorting (stable) with predictable speed.",
      time: "O(n log n)",
      space: "O(n)",
      note: "Green is shown for a fully merged, sorted range after merge steps.",
    },
    Quick: {
      summary:
        "Quick Sort selects a pivot and partitions values into ≤ pivot and > pivot regions, then recurses on each partition.",
      best: "Fast on average for large datasets (but worst-case exists).",
      time: "O(n log n) avg · O(n²) worst",
      space: "O(log n) avg recursion",
      note: "Pivot choice affects performance. Watch how the left region grows in partition.",
    },
  };
  
  // ------------------------ Variable labels (UI helper) ------------------------

  // Returns a short label for a given array index based on the current step
  // Used by the UI to label indices like i, j, min, pivot, key, etc.
  export function getVarLabel(algoName, step, idx) {
    const h = step?.highlight || {};
    const cmp = h.compare || [];
    const pivot = h.pivot;
  
    // Shared pivot labelling
    if (typeof pivot === "number" && pivot === idx) return "pivot";
  
    // Quick Sort: compare array index j against pivot
    if (algoName === "Quick" && cmp.length === 2) {
      if (idx === cmp[0]) return "j";
      if (idx === cmp[1]) return "pivot";
    }
  
     // Bubble Sort: comparing adjacent positions i and i+1
    if (algoName === "Bubble" && cmp.length === 2) {
      if (idx === cmp[0]) return "i";
      if (idx === cmp[1]) return "i+1";
    }
  
    // Selection Sort: current minimum vs scanning index j
    if (algoName === "Selection" && cmp.length === 2) {
      if (idx === cmp[0]) return "min";
      if (idx === cmp[1]) return "j";
    }
  
    // Insertion Sort: compared single value is often the key
    if (algoName === "Insertion" && cmp.length === 1 && idx === cmp[0]) return "key";
  
    return "";
  }
  