// Refactored Dashboard.jsx - Best Practices Example
// Shows how to use new hooks, utilities, and CSS classes

import { useState } from "react";
import { useSummary, useCandidates, useJobs } from "../hooks";
import { ago, formatDate } from "../utils/helpers";
import { STATUS_COLORS, COLORS } from "../utils/constants";
import { Card, Badge, Btn, Spinner } from "../components/ui";
import '../styles/dashboard.css'; // Import page-specific styles

export default function Dashboard() {
  const { summary, loading: summaryLoading, error: summaryError } = useSummary();
  const { candidates, loading: candLoading } = useCandidates({ limit: 5, autoLoad: true });
  const { jobs, loading: jobsLoading } = useJobs({ limit: 5, autoLoad: true });

  if (summaryLoading) {
    return (
      <div className="loading">
        <Spinner size={32} />
      </div>
    );
  }

  if (summaryError) {
    return (
      <div className="empty-state">
        <h3>Error loading dashboard</h3>
        <p>Please try refreshing the page</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeUp dashboard-container">
      {/* Page Title */}
      <div className="flex-between mb-20">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-muted text-sm">Welcome back! Here's your hiring overview.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid-cols-4 gap-md mb-30">
        {[
          { 
            label: 'Total Jobs', 
            value: summary?.total_jobs || 0,
            icon: '📋',
            color: COLORS.primary,
          },
          {
            label: 'Active Candidates',
            value: summary?.active_candidates || 0,
            icon: '👥',
            color: COLORS.success,
          },
          {
            label: 'Interviews Today',
            value: summary?.interviews_today || 0,
            icon: '📞',
            color: COLORS.warning,
          },
          {
            label: 'Pending Actions',
            value: summary?.pending_actions || 0,
            icon: '⏰',
            color: COLORS.danger,
          },
        ].map((stat) => (
          <Card key={stat.label} className="stat-card">
            <div className="flex-between mb-10">
              <span style={{ fontSize: '32px' }}>{stat.icon}</span>
              <span style={{ color: stat.color, fontWeight: 700 }}>+{Math.floor(Math.random() * 20)}%</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
              {stat.value}
            </div>
            <div className="text-muted text-sm">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid-cols-2 gap-lg">
        {/* Recent Candidates */}
        <div>
          <div className="flex-between mb-15">
            <h2 className="section-title">Recent Candidates</h2>
            <Btn size="sm" variant="secondary">View All</Btn>
          </div>

          {candLoading ? (
            <Card className="loading">
              <Spinner size={24} />
            </Card>
          ) : candidates.length > 0 ? (
            <div className="space-y-10">
              {candidates.map((candidate) => (
                <Card key={candidate.id} className="candidate-row">
                  <div className="flex-between gap-10">
                    <div className="flex-col gap-5" style={{ flex: 1 }}>
                      <div className="font-semibold">{candidate.name}</div>
                      <div className="text-sm text-muted">{candidate.role}</div>
                      <div className="text-xs text-muted">{ago(candidate.applied_at)}</div>
                    </div>
                    <Badge 
                      label={candidate.status} 
                      variant={
                        candidate.status === 'hired' ? 'success' :
                        candidate.status === 'rejected' ? 'danger' :
                        'primary'
                      }
                    />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="text-muted">No candidates yet</p>
            </div>
          )}
        </div>

        {/* Recent Job Postings */}
        <div>
          <div className="flex-between mb-15">
            <h2 className="section-title">Open Jobs</h2>
            <Btn size="sm" variant="secondary">Create Job</Btn>
          </div>

          {jobsLoading ? (
            <Card className="loading">
              <Spinner size={24} />
            </Card>
          ) : jobs.length > 0 ? (
            <div className="space-y-10">
              {jobs.map((job) => (
                <Card key={job.id} className="job-row">
                  <div className="flex-between gap-10">
                    <div className="flex-col gap-5" style={{ flex: 1 }}>
                      <div className="font-semibold">{job.title}</div>
                      <div className="text-sm text-muted">{job.department}</div>
                      <div className="flex gap-5 align-center">
                        <Badge label={`${job.applicants || 0} applicants`} variant="info" />
                        <span className="text-xs text-muted">{ago(job.created_at)}</span>
                      </div>
                    </div>
                    <Badge 
                      label={job.status}
                      variant={job.status === 'open' ? 'success' : 'muted'}
                    />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="text-muted">No open jobs yet</p>
              <Btn style={{ marginTop: '1rem' }}>Create First Job</Btn>
            </div>
          )}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="mt-30">
        <h2 className="section-title mb-15">Recent Activity</h2>
        <Card>
          <div className="space-y-15">
            {[
              { type: 'candidate', text: 'New candidate applied for Senior Engineer', time: '2 hours ago', icon: '👤' },
              { type: 'interview', text: 'Interview scheduled with John Doe', time: '1 day ago', icon: '📞' },
              { type: 'hire', text: 'Candidate hired: Jane Smith', time: '3 days ago', icon: '🎉' },
            ].map((activity, i) => (
              <div key={i} className="flex-between gap-15" style={{ paddingBottom: '15px', borderBottom: 'var(--border) 1px solid' }}>
                <div className="flex gap-15">
                  <span style={{ fontSize: '24px' }}>{activity.icon}</span>
                  <div className="flex-col gap-5">
                    <div className="text-sm">{activity.text}</div>
                    <div className="text-xs text-muted">{activity.time}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
