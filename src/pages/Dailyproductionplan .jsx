import React, { useState } from 'react';
import Layout from '../components/Layout';
import Tabs from '../components/Tabs';
import { SectionHeader2 } from '../components/EmptyState';
import { PreGradingPhase } from './Pregradingphase ';
import { PostGradingPhase } from './Postgradingphase';
import { FullDayPlan } from './Fulldayplan';
import Card from '../components/Card';

 const tabs = [
    {
      key: 'full',
      label: 'Full day plan',
      icon: '📋',
      description: 'Both phases',
    },
    {
      key: 'pre',
      label: 'Phase 1: Pre-grading',
      icon: '⚗️',
      description: 'Raw → Graded',
    },
    {
      key: 'post',
      label: 'Phase 2: Post-grading',
      icon: '📦',
      description: 'Graded → Orders',
    },
  ];

export default function DailyProductionPlanInner() {
  const [activeTab, setActiveTab] = useState('full');

  return (
    <Layout>
        {/* <TopBar activeTab={activeTab} /> */}
        <Card>
        <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
        {/* <PhaseTabBar activeTab={activeTab} onChange={setActiveTab} /> */}

        {activeTab === 'full' && <FullDayPlan />}

        {activeTab === 'pre' && (
          // <div className="max-w-3xl mx-auto">
          <div className="mx-auto">
            <SectionHeader2
              step="1"
              title="Pre-grading: raw material → grading → graded inventory"
              phaseColor="pre"
            />
            <PreGradingPhase />
          </div>
        )}

        {activeTab === 'post' && (
          // <div className="max-w-3xl mx-auto">
          <div className="mx-auto">
            <SectionHeader2
              step="2"
              title="Post-grading: graded stock → processing → orders fulfilled"
              phaseColor="post"
            />
            <PostGradingPhase />
          </div>
        )}

        </Card>
    </Layout>
  );
}