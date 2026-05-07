import React, { useState } from 'react';
import styled from 'styled-components';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { SectionHeader } from '../components/EmptyState';
import Button from '../components/Button';
import { FaArrowRight } from 'react-icons/fa';

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const BatchGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const ProgressBar = styled.div`
  height: 8px;
  background: #1f2937;
  border-radius: 9999px;
  overflow: hidden;
  margin: 12px 0;
`;

const StageBar = styled.div`
  height: 100%;
  background: ${(props) => props.color};
  width: ${(props) => props.width}%;
  transition: width 0.4s ease;
`;

const BatchScreen = () => {
  const [data] = useState({
    total_batches: 4,
    in_progress: 2,
    scheduled: 2,
    allocating: 0,
    batches: [
      {
        id: "BAT-20260504-001",
        product: "IQF-CKD",
        grade: "20/25",
        status: "IN_PROGRESS",
        input_mt: 3.00,
        exp_mt: 2.36,
        stages: [
          { name: "Cleaning", percent: 92 },
          { name: "Cooking", percent: 85 },
          { name: "IQF Freezing", percent: 98 },
          { name: "Glazing", percent: 103 },
          { name: "Packing", percent: 99 },
        ]
      },
      {
        id: "BAT-20260504-002",
        product: "IQF-CKD",
        grade: "16/20",
        status: "IN_PROGRESS",
        input_mt: 3.80,
        exp_mt: 2.98,
        stages: [
          { name: "Cleaning", percent: 92 },
          { name: "Cooking", percent: 85 },
          { name: "IQF Freezing", percent: 98 },
          { name: "Glazing", percent: 103 },
          { name: "Packing", percent: 99 },
        ]
      },
      {
        id: "BAT-20260504-003",
        product: "RAW-BLK",
        grade: "26/30",
        status: "SCHEDULED",
        input_mt: 2.50,
        exp_mt: 2.37,
        stages: [
          { name: "Cleaning", percent: 92 },
          { name: "Block Freezing", percent: 99 },
          { name: "Glazing", percent: 103 },
          { name: "Packing", percent: 99 },
        ]
      },
      {
        id: "BAT-20260505-001",
        product: "PD-RAW",
        grade: "20/25",
        status: "SCHEDULED",
        input_mt: 5.20,
        exp_mt: 4.41,
        stages: [
          { name: "Cleaning", percent: 92 },
          { name: "Deveining", percent: 95 },
          { name: "IQF Freezing", percent: 98 },
          { name: "Packing", percent: 99 },
        ]
      },
    ]
  });

  const stats = [
    { label: "TOTAL BATCHES", value: data.total_batches, color: "#60a5fa" },
    { label: "IN PROGRESS", value: data.in_progress, color: "#34d399" },
    { label: "SCHEDULED", value: data.scheduled, color: "#fbbf24" },
    { label: "ALLOCATING", value: data.allocating, color: "#94a3b8" },
  ];

  return (
    <Layout>
      {/* Top Stats */}
      <StatsGrid>
        {stats.map((stat, i) => (
          <Card key={i} className="text-center">
            <p className="text-sm text-text-light mb-1">{stat.label}</p>
            <h2 className="text-4xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </h2>
          </Card>
        ))}
      </StatsGrid>

      {/* Batch Timeline */}
      <BatchTimeline batches={data.batches} />

      {/* Batch Detail Cards */}
      <SectionHeader title="Active Batches" icon="📦" />
      <BatchGrid>
        {data.batches.map((batch) => (
          <BatchCard key={batch.id} batch={batch} />
        ))}
      </BatchGrid>
    </Layout>
  );
};

const BatchTimeline = ({ batches }) => {
  const getStageColor = (name) => {
    if (name.toLowerCase().includes("clean")) return "#10b981";
    if (name.toLowerCase().includes("cook")) return "#ef4444";
    return "#3b82f6";
  };

  return (
    <Card className="mb-8">
      <SectionHeader 
        title="Batch timeline" 
        icon="⏱️" 
        sub="GET /api/planning/batches/?batch_type=SUB_BATCH" 
      />

      <div className="space-y-4 mt-4">
        {batches.map((batch) => (
          <div key={batch.id} className="flex items-center gap-4">
            <div className="w-56">
              <div className="font-mono font-semibold text-primary">{batch.id}</div>
              <div className="text-xs text-text-light">
                {batch.product} {batch.grade}
              </div>
            </div>

            <div className="flex-1">
              <ProgressBar>
                <StageBar 
                  width={85} 
                  color={batch.status === "IN_PROGRESS" ? "#10b981" : "#64748b"} 
                />
              </ProgressBar>
            </div>

            <Badge 
              variant={batch.status === "IN_PROGRESS" ? "success" : "warning"}
            >
              {batch.status.replace("_", " ")}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
};

const BatchCard = ({ batch }) => {
  const statusColor = batch.status === "IN_PROGRESS" ? "success" : "warning";

  return (
    <Card>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="font-mono text-lg font-bold text-primary">{batch.id}</div>
          <div className="text-sm text-text-light">
            {batch.product} • {batch.grade}
          </div>
        </div>
        <Badge variant={statusColor}>
          {batch.status}
        </Badge>
      </div>

      {/* Input / Expected Output */}
      <div className="flex justify-between items-center bg-[#0f172a] rounded-lg p-3 mb-4">
        <div>
          <p className="text-xs text-text-light">In</p>
          <p className="text-xl font-semibold">{batch.input_mt} MT</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-light">Exp</p>
          <p className="text-xl font-semibold text-emerald-400">{batch.exp_mt} MT</p>
        </div>
      </div>

      {/* Progress Dots */}
      <div className="flex justify-center gap-2 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${
              i < 2 ? 'bg-cyan-400' : 'bg-gray-600'
            }`}
          />
        ))}
      </div>

      {/* Stages */}
      <div className="space-y-3">
        {batch.stages.map((stage, idx) => (
          <div key={idx} className="flex justify-between items-center text-sm">
            <span className="text-text-light">{stage.name}</span>
            <span className="font-semibold text-emerald-400">
              {stage.percent}%
            </span>
          </div>
        ))}
      </div>

      <div className='w-full'>
      <Button fullWidth={true}>Advance Stage  <FaArrowRight /></Button>
      </div>
    </Card>
  );
};

export default BatchScreen;