import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { debounce } from "~/shareds/lib/debounce";

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs the call once the wait has elapsed", () => {
    const spy = vi.fn();
    const debounced = debounce(spy, 300);

    debounced();
    expect(spy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(299);
    expect(spy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("coalesces a burst of calls into a single trailing call", () => {
    const spy = vi.fn();
    const debounced = debounce(spy, 300);

    // What a slider drag looks like: one call per frame.
    for (let i = 0; i < 20; i++) {
      debounced();
      vi.advanceTimersByTime(16);
    }

    expect(spy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("cancel drops a queued call for good", () => {
    // This is what stops a slider commit landing after a reset and undoing it.
    const spy = vi.fn();
    const debounced = debounce(spy, 300);

    debounced();
    debounced.cancel();

    vi.advanceTimersByTime(5000);
    expect(spy).not.toHaveBeenCalled();
  });

  it("stays usable after a cancel", () => {
    const spy = vi.fn();
    const debounced = debounce(spy, 300);

    debounced();
    debounced.cancel();
    debounced();

    vi.advanceTimersByTime(300);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
