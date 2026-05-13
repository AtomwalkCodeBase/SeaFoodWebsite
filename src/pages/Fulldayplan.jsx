import React from 'react';
import { FiArrowRight } from 'react-icons/fi';
import { SectionHeader, SectionHeader2 } from '../components/EmptyState';
import { PreGradingPhase } from './Pregradingphase ';
import { PostGradingPhase } from './Postgradingphase';
import Button from '../components/Button';

export function FullDayPlan({setIsOpenGrnModal, speciesList}) {
   
  return (
    <>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Phase 1 column */}
      <div>
        <div className='flex justify-between items-center'>
        <SectionHeader
          step="1"
          title="Pre-grading: raw material → grading → graded inventory"
          // phaseColor="pre"
        />
        <Button size='sm' onClick = {() => setIsOpenGrnModal(true)}>Add GRN</Button>

        </div>
        <PreGradingPhase speciesList={speciesList} />
      </div>

      {/* Divider (visible on XL) */}
      {/* <div className="hidden xl:flex flex-col items-center justify-start pt-20 gap-2 -mx-3">
        <div className="flex-1 w-px bg-border" />
        <div className="w-8 h-8 rounded-full bg-backgroundAlt border border-border flex items-center justify-center">
          <FiArrowRight size={14} className="text-text-light" />
        </div>
        <div className="flex-1 w-px bg-border" />
      </div> */}

      {/* Mobile divider */}
      <div className="xl:hidden flex items-center gap-3 -my-2">
        <div className="flex-1 h-px bg-border" />
        <div className="text-xs text-text-light bg-backgroundAlt border border-border px-2 py-0.5 rounded-full">
          Grading complete → plan post-grading
        </div>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Phase 2 column */}
      <div>
        <SectionHeader2
          step="2"
          title="Post-grading: graded stock → processing → orders fulfilled"
          phaseColor="post"
        />
        <PostGradingPhase />
      </div>
    </div>
    </>
  );
}