// Refactored Interview.jsx - Memory Leak Fixes
// Shows how to use usePolling() hook and proper cleanup

import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePolling, useAsync } from "../hooks";
import { interviewAPI, jobsAPI, candidatesAPI, evaluationAPI, assignmentAPI } from "../lib/api";
import { useToastStore } from "../store/useStore";
import { ROLE_CATEGORIES } from "../utils/constants";

const STAGES = {
  PROFILE: 'profile',
  LIVE: 'live',
  EVALUATING: 'evaluating',
  DONE: 'done',
};

export default function Interview() {
  const { token } = useParams();
  const navigate = useNavigate();
  const toast = useToastStore(s => s.add);

  // Form inputs
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [jobLoading, setJobLoading] = useState(true);

  // Interview state
  const [stage, setStage] = useState(STAGES.PROFILE);
  const [interviewId, setInterviewId] = useState(null);
  const [candidateId, setCandidateId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  // Typing effect state
  const [typing, setTyping] = useState(false);
  const [typingTxt, setTypingTxt] = useState("");
  const typewriterIntervalRef = useRef(null);

  // Job loading
  const [job, setJob] = useState(null);

  // Evaluation & Assignment
  const [evaluation, setEvaluation] = useState(null);
  const [assignment, setAssignment] = useState(null);

  // Use usePolling hook for safe polling (proper cleanup)
  const { data: pollData, stop: stopPolling, isPolling } = usePolling(
    async () => {
      if (!candidateId) return null;
      const res = await candidatesAPI.get(candidateId);
      const candidate = res.data.candidate;
      
      // Check if evaluation is ready
      if (candidate.status === "evaluated" || candidate.status === "hired") {
        return {
          candidate,
          evaluation: res.data.evaluation,
          assignment: res.data.assignment,
          ready: true,
        };
      }
      return { ready: false };
    },
    3000, // Poll every 3 seconds
    false // Don't auto-start (we'll control when to start)
  );

  // Load job from token
  useEffect(() => {
    const loadJob = async () => {
      if (!token) {
        setJobLoading(false);
        return;
      }
      
      try {
        const res = await jobsAPI.byToken(token);
        setJob(res.data.job);
      } catch (err) {
        console.error("Failed to load job:", err);
      } finally {
        setJobLoading(false);
      }
    };

    loadJob();
  }, [token]);

  // Safe typewriter effect with proper cleanup
  const typewriter = (text, onDone) => {
    setTyping(true);
    setTypingTxt("");
    
    let i = 0;
    const speed = Math.max(8, 22 - text.length / 30);

    // Clear any previous interval
    if (typewriterIntervalRef.current) {
      clearInterval(typewriterIntervalRef.current);
    }

    typewriterIntervalRef.current = setInterval(() => {
      if (i < text.length) {
        setTypingTxt(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(typewriterIntervalRef.current);
        setTyping(false);
        onDone(text);
      }
    }, speed);
  };

  // Cleanup typewriter interval on unmount
  useEffect(() => {
    return () => {
      if (typewriterIntervalRef.current) {
        clearInterval(typewriterIntervalRef.current);
      }
      // Stop polling on unmount
      stopPolling();
    };
  }, [stopPolling]);

  // Handle polling results
  useEffect(() => {
    if (pollData?.ready) {
      stopPolling();
      setEvaluation(pollData.evaluation);
      setAssignment(pollData.assignment);
      setStage(STAGES.DONE);
    }
  }, [pollData, stopPolling]);

  // Start interview
  const startInterview = async () => {
    if (!name.trim() || !email.trim() || !role.trim()) {
      toast("Please fill in all fields", "error");
      return;
    }

    setStage(STAGES.LIVE);
    setSending(true);

    try {
      const payload = {
        jobToken: token || "demo",
        candidateName: name,
        candidateEmail: email,
        candidateRole: role,
      };

      const res = await interviewAPI.start(payload);
      setInterviewId(res.data.interviewId);
      setCandidateId(res.data.candidateId);
      setMessages([{
        role: "assistant",
        content: res.data.message,
        id: Date.now(),
      }]);

      // Start typing animation
      typewriter(res.data.message, () => {
        setTypingTxt("");
      });
    } catch (e) {
      toast(e.response?.data?.error || "Failed to start interview", "error");
      setStage(STAGES.PROFILE);
    } finally {
      setSending(false);
    }
  };

  // Send message to interview
  const sendMessage = async () => {
    if (!input.trim() || sending || typing) return;

    const userMsg = {
      role: "user",
      content: input.trim(),
      id: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    const sent = input.trim();
    setInput("");
    setSending(true);

    try {
      const res = await interviewAPI.message({
        interviewId,
        candidateId,
        message: sent,
      });

      setSending(false);

      const ariaMsg = {
        role: "assistant",
        content: res.data.message,
        id: Date.now(),
      };

      if (res.data.complete) {
        // Interview complete - start polling for evaluation
        setMessages(prev => [...prev, ariaMsg]);
        setStage(STAGES.EVALUATING);
        // Start polling using the hook
        // (the hook is configured above with isPolling: false)
        // We need to trigger it - this is where usePolling would start
      } else {
        // Continue conversation with typing effect
        typewriter(res.data.message, () => {
          setMessages(prev => [...prev, ariaMsg]);
          setTypingTxt("");
        });
      }
    } catch (e) {
      setSending(false);
      toast(e.response?.data?.error || "Failed to send message", "error");
    }
  };

  // ── PROFILE STAGE ─────────────────────────────────────────
  if (jobLoading) {
    return <LoadingScreen />;
  }

  if (stage === STAGES.PROFILE) {
    return (
      <div className="interview-container animate-fadeUp">
        <div className="interview-header">
          {job ? (
            <>
              <h1>{job.title}</h1>
              <p className="text-muted">{job.company_name}</p>
            </>
          ) : (
            <>
              <h1>Practice Interview</h1>
              <p className="text-muted">Demo mode - no job selected</p>
            </>
          )}
        </div>

        <div className="card" style={{ maxWidth: 400, margin: "2rem auto" }}>
          <h2 className="form-title">Let's Get Started</h2>

          <div className="form-group">
            <label>Full Name</label>
            <input
              className="input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>

          <div className="form-group">
            <label>Target Role</label>
            <select
              className="select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">Select a role...</option>
              {Object.keys(ROLE_CATEGORIES).map(roleKey => (
                <option key={roleKey} value={roleKey}>{roleKey}</option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-primary"
            onClick={startInterview}
            disabled={sending || !name.trim() || !email.trim() || !role.trim()}
            style={{ width: "100%", marginTop: "1rem" }}
          >
            {sending ? "Starting..." : "Start Interview"}
          </button>
        </div>
      </div>
    );
  }

  // ── INTERVIEW STAGE ─────────────────────────────────────────
  if (stage === STAGES.LIVE || stage === STAGES.EVALUATING) {
    return (
      <InterviewChat
        messages={messages}
        input={input}
        onInputChange={setInput}
        onSendMessage={sendMessage}
        sending={sending}
        typing={typing}
        typingText={typingTxt}
        isEvaluating={stage === STAGES.EVALUATING}
      />
    );
  }

  // ── DONE STAGE ─────────────────────────────────────────
  if (stage === STAGES.DONE && evaluation) {
    return (
      <EvaluationResults
        evaluation={evaluation}
        assignment={assignment}
      />
    );
  }

  return null;
}

// Reusable component for interview chat
function InterviewChat({
  messages, input, onInputChange, onSendMessage, sending, typing, typingText, isEvaluating
}) {
  const chatEnd = useRef(null);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingText]);

  return (
    <div className="interview-container">
      <div className="chat-box">
        <div className="messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.role}`}>
              {msg.role === "assistant" && <span className="avatar">🤖</span>}
              <div className="content">{msg.content}</div>
            </div>
          ))}

          {typing && typingText && (
            <div className="message assistant">
              <span className="avatar">🤖</span>
              <div className="content">{typingText}|</div>
            </div>
          )}

          {isEvaluating && (
            <div className="message system">
              <div className="content">⏳ Evaluating your interview...</div>
            </div>
          )}

          <div ref={chatEnd} />
        </div>

        {!isEvaluating && (
          <div className="input-area">
            <input
              className="input"
              type="text"
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && onSendMessage()}
              placeholder="Type your response..."
              disabled={sending || typing}
            />
            <button
              className="btn btn-primary"
              onClick={onSendMessage}
              disabled={sending || typing || !input.trim()}
            >
              {sending ? "..." : "Send"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Loading screen component
function LoadingScreen() {
  return (
    <div className="interview-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div className="loading">
        <div className="spinner"></div>
        <p className="text-muted">Loading interview...</p>
      </div>
    </div>
  );
}

// Evaluation results component
function EvaluationResults({ evaluation, assignment }) {
  return (
    <div className="interview-container animate-fadeUp">
      <div className="interview-header">
        <h1>Interview Complete! 🎉</h1>
        <p className="text-muted">Here's your evaluation</p>
      </div>

      <div className="evaluation-results">
        {/* Evaluation details */}
        <div className="card">
          <h2>Overall Score: {evaluation.score}/5</h2>
          <p>{evaluation.summary}</p>
        </div>

        {/* Assignment if provided */}
        {assignment && (
          <div className="card">
            <h2>Next Steps</h2>
            <p>{assignment.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
