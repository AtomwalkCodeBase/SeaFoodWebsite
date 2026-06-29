import React from 'react'
import { useProcessActivityList } from '../../../hooks/useProductQueries';
import styled from 'styled-components';
import { theme } from '../../../styles/Theme';
import Badge from '../../../components/Badge';

const TimelineBar = styled.div`
  flex: 1;
  min-width: 0;
  height: 8px;
  background: #1f2937;
  border-radius: 9999px;
  overflow: hidden;
`;

const TimelineFill = styled.div`
  height: 100%;
  background: ${(props) => props.color || "#10b981"};
  width: ${(props) => props.width}%;
  transition: width 0.4s ease;
`;

const getDynamicSteps = (processActivities = []) => {
  if (processActivities?.length > 0) {
    return processActivities
      .sort((a, b) => (a.sequence ?? a.id ?? 0) - (b.sequence ?? b.id ?? 0))
      .map((x) => x.activity_name)
      .filter(Boolean);
  }
  return [];
};

const BatchTimeline = ({ batch }) => {
  const {data: activitiesData , isLoading: processActivityLoading} = useProcessActivityList(!!batch.product, batch.product);

  const dynamicSteps = getDynamicSteps(activitiesData);

  const completedSteps = batch.activity_logs?.filter((x) => x.status === "COMPLETED")?.map((x) => x.activity_name) || [];
  const totalSteps = dynamicSteps.length || 1;
  const progressPct = Math.min((completedSteps.length / totalSteps) * 100, 100);
  const statusVariant = batch.status === "IN_PROGRESS" ? "warning" : batch.status === "COMPLETED" ? "success" : batch.status === "SCHEDULED" ? "error" : batch.status === "CANCELLED" ? "error" : "info" ;

  return (
    <div className="flex items-start gap-4">
      <div className="w-58 shrink-0">
        <div className="font-mono font-semibold text-primary">{batch.batch_number}</div>
        <div className="text-xs text-text-light">
          {batch.product_code} {batch.grade_code}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <TimelineBar>
            <TimelineFill
              width={progressPct}
              color={batch.status === "IN_PROGRESS" ? `${theme.colors.warning}` : batch.status === "COMPLETED" ? `${theme.colors.success}` : batch.status === "SCHEDULED" ? "#666666" : batch.status === "CANCELLED" ? `${theme.colors.error}` : `${theme.colors.info}`}
            />
          </TimelineBar>
          <Badge variant={statusVariant} className="shrink-0 whitespace-nowrap">
            {String(batch.status || "").replace("_", " ")}
          </Badge>
        </div>
        <div className="text-[11px] text-text-light mt-1">
          {completedSteps.length}/{totalSteps} steps completed
        </div>
      </div>
    </div>
  );
};

export default BatchTimeline