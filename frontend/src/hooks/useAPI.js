import { useAsync, usePaginated, useSearch } from './useAsync';
import * as api from '../lib/api';

/**
 * Hook for fetching candidates with optional filtering
 * @param {object} options - { limit, filter, search, autoLoad }
 * @returns {object} { candidates, loading, error, refetch, hasMore, page, nextPage, prevPage }
 */
export const useCandidates = (options = {}) => {
  const { limit = 10, filter = 'all', search = '', autoLoad = true } = options;

  const fetchFn = async (pageLimit, offset) => {
    const params = {
      limit: pageLimit,
      offset,
    };

    if (filter && filter !== 'all') {
      params.status = filter;
    }

    if (search) {
      params.search = search;
    }

    const response = await api.candidatesAPI.list(params);
    return {
      data: response.data.candidates || [],
      total: response.data.total,
    };
  };

  const { items, ...rest } = usePaginated(fetchFn, { limit, autoLoad });

  return {
    candidates: items,
    ...rest,
  };
};

/**
 * Hook for fetching a single candidate with details
 * @param {string} candidateId - Candidate ID
 * @returns {object} { candidate, loading, error, refetch }
 */
export const useCandidate = (candidateId) => {
  const fetchFn = async () => {
    if (!candidateId) return null;
    const response = await api.candidatesAPI.get(candidateId);
    return response.data;
  };

  const { data: candidate, ...rest } = useAsync(fetchFn, [candidateId], !!candidateId);

  return {
    candidate,
    ...rest,
  };
};

/**
 * Hook for fetching jobs with optional filtering
 * @param {object} options - { limit, status, autoLoad }
 * @returns {object} { jobs, loading, error, refetch, hasMore, page, nextPage, prevPage }
 */
export const useJobs = (options = {}) => {
  const { limit = 10, status = '', autoLoad = true } = options;

  const fetchFn = async (pageLimit, offset) => {
    const params = {
      limit: pageLimit,
      offset,
    };

    if (status) {
      params.status = status;
    }

    const response = await api.jobsAPI.list(params);
    return {
      data: response.data.jobs || [],
      total: response.data.total,
    };
  };

  const { items, ...rest } = usePaginated(fetchFn, { limit, autoLoad });

  return {
    jobs: items,
    ...rest,
  };
};

/**
 * Hook for fetching a single job with details
 * @param {string} jobId - Job ID
 * @returns {object} { job, loading, error, refetch }
 */
export const useJob = (jobId) => {
  const fetchFn = async () => {
    if (!jobId) return null;
    const response = await api.jobsAPI.get(jobId);
    return response.data;
  };

  const { data: job, ...rest } = useAsync(fetchFn, [jobId], !!jobId);

  return {
    job,
    ...rest,
  };
};

/**
 * Hook for fetching dashboard summary
 * @returns {object} { summary, loading, error, refetch }
 */
export const useSummary = () => {
  const fetchFn = async () => {
    const response = await api.reportsAPI.summary();
    return response.data;
  };

  const { data: summary, ...rest } = useAsync(fetchFn, []);

  return {
    summary,
    ...rest,
  };
};

/**
 * Hook for interview operations
 * @param {string} jobId - Job ID for starting interview
 * @returns {object} { startInterview, getInterview, sendMessage, interview, loading, error }
 */
export const useInterview = (jobId) => {
  const [interview, setInterview] = null;
  const [loading, setLoading] = null;
  const [error, setError] = null;

  const startInterview = async (candidateData) => {
    setLoading(true);
    try {
      const response = await api.interviewAPI.start({ ...candidateData, job_id: jobId });
      setInterview(response.data);
      return response.data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (message) => {
    try {
      const response = await api.interviewAPI.message(interview.id, { message });
      setInterview(prev => ({
        ...prev,
        transcript: [...(prev.transcript || []), response.data],
      }));
      return response.data;
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const getInterview = async (interviewId) => {
    setLoading(true);
    try {
      const response = await api.interviewAPI.get(interviewId);
      setInterview(response.data);
      return response.data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    interview,
    loading,
    error,
    startInterview,
    sendMessage,
    getInterview,
  };
};

/**
 * Hook for searching candidates
 * @returns {object} { results, loading, search, query }
 */
export const useCandidateSearch = () => {
  const searchFn = async (query) => {
    const response = await api.candidatesAPI.list({ search: query, limit: 50 });
    return response.data.candidates || [];
  };

  const { results, ...rest } = useSearch(searchFn, 300);

  return {
    candidates: results,
    ...rest,
  };
};

/**
 * Hook for searching jobs
 * @returns {object} { results, loading, search, query }
 */
export const useJobSearch = () => {
  const searchFn = async (query) => {
    const response = await api.jobsAPI.list({ search: query, limit: 50 });
    return response.data.jobs || [];
  };

  const { results, ...rest } = useSearch(searchFn, 300);

  return {
    jobs: results,
    ...rest,
  };
};

/**
 * Hook for company settings
 * @returns {object} { company, loading, error, updateCompany, refetch }
 */
export const useCompanySettings = () => {
  const [company, setCompany] = null;
  const [loading, setLoading] = null;
  const [error, setError] = null;

  const fetchCompany = async () => {
    setLoading(true);
    try {
      const response = await api.companyAPI.get();
      setCompany(response.data);
      return response.data;
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const updateCompany = async (updates) => {
    try {
      const response = await api.companyAPI.update(updates);
      setCompany(response.data);
      return response.data;
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  return {
    company,
    loading,
    error,
    refetch: fetchCompany,
    updateCompany,
  };
};
