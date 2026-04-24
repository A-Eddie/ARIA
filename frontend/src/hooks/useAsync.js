import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Generic hook for handling async operations
 * @param {Function} asyncFn - Async function to execute
 * @param {Array} dependencies - Dependency array for effect
 * @param {boolean} immediate - Whether to run immediately (default: true)
 * @returns {object} { data, loading, error, refetch }
 */
export const useAsync = (asyncFn, dependencies = [], immediate = true) => {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null,
  });

  const abortControllerRef = useRef(null);

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    abortControllerRef.current = new AbortController();

    try {
      const response = await asyncFn(abortControllerRef.current.signal);
      setState({ data: response, loading: false, error: null });
      return response;
    } catch (err) {
      if (err.name !== 'AbortError') {
        setState({ data: null, loading: false, error: err });
      }
    }
  }, [asyncFn]);

  useEffect(() => {
    if (immediate) {
      execute();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, dependencies);

  return { ...state, refetch: execute };
};

/**
 * Hook for paginated data fetching
 * @param {Function} fetchFn - Async function that takes (limit, offset)
 * @param {object} options - { limit, autoLoad }
 * @returns {object} { items, loading, error, page, pageSize, hasMore, nextPage, prevPage, refetch }
 */
export const usePaginated = (fetchFn, options = {}) => {
  const { limit = 10, autoLoad = true } = options;
  const [state, setState] = useState({
    items: [],
    loading: false,
    error: null,
    page: 1,
    hasMore: true,
  });

  const abortControllerRef = useRef(null);

  const load = useCallback(async (pageNum) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    abortControllerRef.current = new AbortController();

    try {
      const offset = (pageNum - 1) * limit;
      const response = await fetchFn(limit, offset, abortControllerRef.current.signal);
      
      setState(prev => ({
        ...prev,
        items: response.data || response,
        loading: false,
        page: pageNum,
        hasMore: (response.data || response).length === limit,
      }));
    } catch (err) {
      if (err.name !== 'AbortError') {
        setState(prev => ({ ...prev, loading: false, error: err }));
      }
    }
  }, [fetchFn, limit]);

  useEffect(() => {
    if (autoLoad) {
      load(1);
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchFn, limit, autoLoad]);

  return {
    ...state,
    pageSize: limit,
    nextPage: () => state.hasMore && load(state.page + 1),
    prevPage: () => state.page > 1 && load(state.page - 1),
    refetch: () => load(state.page),
  };
};

/**
 * Hook with debounced search
 * @param {Function} searchFn - Async function that takes (query)
 * @param {number} debounceMs - Debounce delay
 * @returns {object} { results, loading, error, search, query }
 */
export const useSearch = (searchFn, debounceMs = 300) => {
  const [state, setState] = useState({
    results: [],
    loading: false,
    error: null,
    query: '',
  });

  const timeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  const search = useCallback((query) => {
    setState(prev => ({ ...prev, query }));

    if (!query.trim()) {
      setState(prev => ({ ...prev, results: [], loading: false }));
      return;
    }

    clearTimeout(timeoutRef.current);
    setState(prev => ({ ...prev, loading: true }));

    timeoutRef.current = setTimeout(async () => {
      abortControllerRef.current = new AbortController();

      try {
        const response = await searchFn(query, abortControllerRef.current.signal);
        setState(prev => ({
          ...prev,
          results: response.data || response,
          loading: false,
          error: null,
        }));
      } catch (err) {
        if (err.name !== 'AbortError') {
          setState(prev => ({ ...prev, loading: false, error: err }));
        }
      }
    }, debounceMs);
  }, [searchFn, debounceMs]);

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { ...state, search };
};

/**
 * Hook for managing form state and validation
 * @param {object} initialValues - Initial form values
 * @param {Function} onSubmit - Submit handler
 * @param {object} validate - Validation function or object
 * @returns {object} { values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue }
 */
export const useForm = (initialValues, onSubmit, validate) => {
  const [state, setState] = useState({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
  });

  const validateForm = useCallback((values) => {
    if (typeof validate === 'function') {
      return validate(values);
    }
    return validate ? validate(values) : {};
  }, [validate]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setState(prev => ({
      ...prev,
      values: {
        ...prev.values,
        [name]: type === 'checkbox' ? checked : value,
      },
    }));
  }, []);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setState(prev => ({
      ...prev,
      touched: {
        ...prev.touched,
        [name]: true,
      },
    }));

    const errors = validateForm(state.values);
    setState(prev => ({
      ...prev,
      errors,
    }));
  }, [state.values, validateForm]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const errors = validateForm(state.values);
      
      setState(prev => ({
        ...prev,
        errors,
        touched: Object.keys(state.values).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {}),
      }));

      if (Object.keys(errors).length === 0) {
        setState(prev => ({ ...prev, isSubmitting: true }));
        try {
          await onSubmit(state.values);
        } finally {
          setState(prev => ({ ...prev, isSubmitting: false }));
        }
      }
    },
    [state.values, validateForm, onSubmit]
  );

  const setFieldValue = useCallback((name, value) => {
    setState(prev => ({
      ...prev,
      values: {
        ...prev.values,
        [name]: value,
      },
    }));
  }, []);

  return {
    values: state.values,
    errors: state.errors,
    touched: state.touched,
    isSubmitting: state.isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    reset: () => setState({ values: initialValues, errors: {}, touched: {}, isSubmitting: false }),
  };
};

/**
 * Hook for polling data at intervals
 * @param {Function} fn - Function to call
 * @param {number} ms - Poll interval
 * @param {boolean} enabled - Whether polling is enabled
 * @returns {object} { data, error, stop, start }
 */
export const usePolling = (fn, ms = 5000, enabled = true) => {
  const [state, setState] = useState({
    data: null,
    error: null,
    isPolling: enabled,
  });

  const intervalRef = useRef(null);
  const abortControllerRef = useRef(null);

  const poll = useCallback(async () => {
    abortControllerRef.current = new AbortController();

    try {
      const response = await fn(abortControllerRef.current.signal);
      setState(prev => ({
        ...prev,
        data: response,
        error: null,
      }));
    } catch (err) {
      if (err.name !== 'AbortError') {
        setState(prev => ({
          ...prev,
          error: err,
        }));
      }
    }
  }, [fn]);

  const start = useCallback(() => {
    setState(prev => ({ ...prev, isPolling: true }));
    poll();
    intervalRef.current = setInterval(poll, ms);
  }, [poll, ms]);

  const stop = useCallback(() => {
    setState(prev => ({ ...prev, isPolling: false }));
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      start();
    }

    return () => {
      stop();
    };
  }, [enabled]);

  return {
    ...state,
    start,
    stop,
  };
};

/**
 * Hook for tracking local state changes
 * @param {object} initialValue - Initial state
 * @returns {object} { value, setValue, isDirty, reset }
 */
export const useLocalState = (initialValue) => {
  const [value, setValue] = useState(initialValue);
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = useCallback((newValue) => {
    setValue(newValue);
    setIsDirty(true);
  }, []);

  const reset = useCallback(() => {
    setValue(initialValue);
    setIsDirty(false);
  }, [initialValue]);

  return {
    value,
    setValue: handleChange,
    isDirty,
    reset,
  };
};
