import React, { useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import {
  LuFlaskConical, LuThermometer, LuRuler, LuEye, LuSnowflake,
  LuUser, LuUsers, LuClock, LuChevronDown, LuFish, LuShieldCheck,
  LuPackage, LuMinus
} from 'react-icons/lu';
import Modal from '../Modal';
import { TbAlertTriangle } from 'react-icons/tb';
import { FaRegCheckCircle } from 'react-icons/fa';

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const slideDown = keyframes`
  from { opacity: 0; max-height: 0; }
  to   { opacity: 1; max-height: 1000px; }
`;

// ─── Layout ───────────────────────────────────────────────────────────────────

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`;

// ─── RM Summary Banner ────────────────────────────────────────────────────────

const RMBanner = styled.div`
  background: ${({ theme }) => theme.colors?.primary ? `${theme.colors.primary}10` : '#f0eeff'};
  border: 1px solid ${({ theme }) => theme.colors?.primary ? `${theme.colors.primary}28` : '#c4b5fd'};
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  animation: ${fadeUp} 0.2s ease both;
`;

const RMTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RMName = styled.span`
  font-size: 0.92rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors?.text || '#222'};
`;

const RMMeta = styled.span`
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors?.textLight || '#888'};
`;

const SampleCountBadge = styled.div`
  font-size: 0.72rem;
  font-weight: 700;
  background: ${({ theme }) => theme.colors?.primary || '#6C5CE7'};
  color: #fff;
  padding: 3px 10px;
  border-radius: 20px;
`;

// ─── Section Label ────────────────────────────────────────────────────────────

const SectionLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: ${({ theme }) => theme.colors?.textLight || '#999'};
  margin-bottom: 0.5rem;
`;

// ─── Sample Card ──────────────────────────────────────────────────────────────

const SampleCard = styled.div`
  border: 1px solid ${({ theme }) => theme.colors?.border || '#e0e0e0'};
  border-radius: 0.75rem;
  overflow: hidden;
  animation: ${fadeUp} 0.22s ease both;
  animation-delay: ${({ index }) => index * 0.05}s;
`;

const SampleHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.9rem;
  background: ${({ theme }) => theme.colors?.backgroundAlt || '#f8f9fc'};
  cursor: pointer;
  user-select: none;
  gap: 0.5rem;
  flex-wrap: wrap;

  &:hover {
    background: ${({ theme }) => theme.colors?.primary ? `${theme.colors.primary}0d` : '#f3f0ff'};
  }
`;

const SampleHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SampleNum = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors?.primary || '#6C5CE7'};
  background: ${({ theme }) => theme.colors?.primary ? `${theme.colors.primary}18` : '#ede9ff'};
  padding: 2px 8px;
  border-radius: 20px;
`;

const SampleId = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors?.text || '#333'};
`;

const SampleHeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusPill = styled.span`
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  background: ${({ status }) =>
    status === 'pass' ? '#d1fae5' : status === 'fail' ? '#fee2e2' : '#fef3c7'};
  color: ${({ status }) =>
    status === 'pass' ? '#065f46' : status === 'fail' ? '#991b1b' : '#92400e'};
`;

const ChevronIcon = styled.span`
  color: ${({ theme }) => theme.colors?.textLight || '#aaa'};
  transition: transform 0.25s ease;
  transform: ${({ isOpen }) => isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
  display: flex;
  align-items: center;
`;

// ─── Sample Body ──────────────────────────────────────────────────────────────

const SampleBody = styled.div`
  display: ${({ isOpen }) => isOpen ? 'block' : 'none'};
  border-top: 1px solid ${({ theme }) => theme.colors?.border || '#e0e0e0'};
  padding: 0.85rem;
  ${({ isOpen }) => isOpen && css`animation: ${slideDown} 0.25s ease;`}
`;

// ─── Inspector Row ────────────────────────────────────────────────────────────

const InspectorRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 0.75rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const InfoChip = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  padding: 0.45rem 0.7rem;
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.colors?.backgroundAlt || '#f8f9fc'};
  border: 1px solid ${({ theme }) => theme.colors?.border || '#e0e0e0'};
  overflow: hidden;
`;

const InfoLabel = styled.span`
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors?.textLight || '#aaa'};
  flex-shrink: 0;
`;

const InfoValue = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors?.text || '#333'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// ─── Time Row ─────────────────────────────────────────────────────────────────

const TimeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
`;

const TimeChip = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors?.text || '#333'};
  background: ${({ theme }) => theme.colors?.backgroundAlt || '#f8f9fc'};
  border: 1px solid ${({ theme }) => theme.colors?.border || '#e0e0e0'};
  padding: 3px 10px;
  border-radius: 6px;
`;

const TimeSep = styled.span`
  font-size: 0.7rem;
  color: ${({ theme }) => theme.colors?.textLight || '#aaa'};
`;

// ─── QC Parameters Grid ───────────────────────────────────────────────────────

const ParamGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.4rem;
  margin-bottom: 0.75rem;

  @media (max-width: 500px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const ParamCard = styled.div`
  border-radius: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors?.border || '#e0e0e0'};
  padding: 0.5rem 0.4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: ${({ theme }) => theme.colors?.card || '#fff'};
  text-align: center;
`;

const ParamIcon = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ ok, theme }) => ok === 'pass'
    ? '#d1fae5' : ok === 'fail'
    ? '#fee2e2'
    : theme.colors?.backgroundAlt || '#f3f3f3'};
  color: ${({ ok }) => ok === 'pass' ? '#059669' : ok === 'fail' ? '#dc2626' : '#888'};
  flex-shrink: 0;
`;

const ParamName = styled.span`
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors?.textLight || '#aaa'};
`;

const ParamValue = styled.span`
  font-size: 0.73rem;
  font-weight: 700;
  color: ${({ ok }) => ok === 'pass' ? '#059669' : ok === 'fail' ? '#dc2626' : '#555'};
`;

// ─── Grade Table ──────────────────────────────────────────────────────────────

const GradeTableWrap = styled.div`
  border: 1px solid ${({ theme }) => theme.colors?.border || '#e0e0e0'};
  border-radius: 0.5rem;
  overflow: hidden;
`;

const GradeTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
  table-layout: fixed;
`;

const GTh = styled.th`
  padding: 0.45rem 0.7rem;
  text-align: ${({ align }) => align || 'left'};
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors?.textLight || '#999'};
  background: ${({ theme }) => theme.colors?.backgroundAlt || '#f8f9fc'};
  border-bottom: 1px solid ${({ theme }) => theme.colors?.border || '#e0e0e0'};
`;

const GTr = styled.tr`
  &:not(:last-child) td {
    border-bottom: 1px solid ${({ theme }) => theme.colors?.border || '#f0f0f0'};
  }
  &:hover td { background: ${({ theme }) => theme.colors?.backgroundAlt || '#f8f9fc'}; }
`;

const GTd = styled.td`
  padding: 0.45rem 0.7rem;
  color: ${({ theme }) => theme.colors?.text || '#333'};
  text-align: ${({ align }) => align || 'left'};
`;

const GradeBadge = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  background: ${({ theme }) => theme.colors?.primary ? `${theme.colors.primary}14` : '#ede9ff'};
  color: ${({ theme }) => theme.colors?.primary || '#6C5CE7'};
  padding: 2px 8px;
  border-radius: 4px;
`;

const PcBadge = styled.span`
  font-size: 0.72rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors?.text || '#333'};
`;

const GradeTotalRow = styled.tr`
  background: ${({ theme }) => theme.colors?.backgroundAlt || '#f8f9fc'};
  td {
    font-weight: 700;
    font-size: 0.78rem;
    color: ${({ theme }) => theme.colors?.text || '#222'};
    padding: 0.45rem 0.7rem;
    border-top: 1px solid ${({ theme }) => theme.colors?.border || '#e0e0e0'};
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getStatusIcon = (s) => {
  if (s === 'pass') return <FaRegCheckCircle size={11} />;
  if (s === 'fail') return <TbAlertTriangle size={11} />;
  return <LuMinus size={11} />;
};

const PARAM_META = [
  { key: 'size',        label: 'Size',        icon: <LuRuler size={13} /> },
  { key: 'smell',       label: 'Smell',       icon: <LuFlaskConical size={13} /> },
  { key: 'appearance',  label: 'Appearance',  icon: <LuEye size={13} /> },
  { key: 'temperature', label: 'Temp (°C)',   icon: <LuThermometer size={13} /> },
  { key: 'ice_condition',label: 'Ice',        icon: <LuSnowflake size={13} /> },
];

// ─── Main Component ───────────────────────────────────────────────────────────

const RMQCModal = ({ isOpen, onClose, data }) => {
  const [openSamples, setOpenSamples] = useState({ 0: true });

  const toggle = (i) =>
    setOpenSamples((prev) => ({ ...prev, [i]: !prev[i] }));

  if (!data) return null;
  const { rm_name, rm_code, vessel_no, samples = [] } = data;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Raw Material QC Report"
      showSaveButton={false}
      cancelButtonText="Close"
      width="46rem"
      maxHeight="68vh"
    >
      <Wrapper>
        {/* ── RM Banner ── */}
        <RMBanner>
          <RMTitle>
            <LuFish size={18} color="#6C5CE7" />
            <div>
              <RMName>{rm_name}</RMName>
              <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                {rm_code && <RMMeta>Code: {rm_code}</RMMeta>}
                {vessel_no && <RMMeta>· Vessel: {vessel_no}</RMMeta>}
              </div>
            </div>
          </RMTitle>
          <SampleCountBadge>{samples.length} Sample{samples.length !== 1 ? 's' : ''} Tested</SampleCountBadge>
        </RMBanner>

        {/* ── Sample Cards ── */}
        {samples.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#aaa', fontSize: '0.85rem' }}>
            No samples recorded yet
          </div>
        ) : (
          samples.map((sample, i) => {
            const totalPc = (sample.grades || []).reduce((s, g) => s + (g.count || 0), 0);
            return (
              <SampleCard key={i} index={i}>
                <SampleHeader onClick={() => toggle(i)}>
                  <SampleHeaderLeft>
                    <SampleNum>S{String(i + 1).padStart(2, '0')}</SampleNum>
                    <SampleId>{sample.sample_id}</SampleId>
                  </SampleHeaderLeft>
                  <SampleHeaderRight>
                    <StatusPill status={sample.overall_status}>
                      {getStatusIcon(sample.overall_status)}
                      {' '}{sample.overall_status === 'pass' ? 'Pass' : sample.overall_status === 'fail' ? 'Fail' : 'Review'}
                    </StatusPill>
                    <ChevronIcon isOpen={!!openSamples[i]}>
                      <LuChevronDown size={16} />
                    </ChevronIcon>
                  </SampleHeaderRight>
                </SampleHeader>

                <SampleBody isOpen={!!openSamples[i]}>
                  {/* Inspector + Manager */}
                  <InspectorRow>
                    <InfoChip>
                      <LuUser size={13} color="#6C5CE7" />
                      <InfoLabel>Inspector</InfoLabel>
                      <InfoValue>{sample.qc_inspector}</InfoValue>
                    </InfoChip>
                    <InfoChip>
                      <LuUsers size={13} color="#6C5CE7" />
                      <InfoLabel>Manager</InfoLabel>
                      <InfoValue>{sample.qc_manager}</InfoValue>
                    </InfoChip>
                  </InspectorRow>

                  {/* Time */}
                  <TimeRow>
                    <LuClock size={13} color="#aaa" />
                    <TimeChip>{sample.start_time}</TimeChip>
                    <TimeSep>→</TimeSep>
                    <TimeChip>{sample.end_time}</TimeChip>
                  </TimeRow>

                  {/* QC Parameters */}
                  <SectionLabel><LuShieldCheck size={12} /> QC Parameters</SectionLabel>
                  <ParamGrid>
                    {PARAM_META.map(({ key, label, icon }) => {
                      const param = sample.parameters?.[key] || {};
                      const ok = param.status || 'neutral';
                      return (
                        <ParamCard key={key}>
                          <ParamIcon ok={ok}>{icon}</ParamIcon>
                          <ParamName>{label}</ParamName>
                          <ParamValue ok={ok}>{param.value ?? '—'}</ParamValue>
                        </ParamCard>
                      );
                    })}
                  </ParamGrid>

                  {/* Grade Breakdown */}
                  <SectionLabel style={{ marginTop: '0.75rem' }}>
                    <LuPackage size={12} /> Grade Breakdown ({totalPc} pc total)
                  </SectionLabel>
                  <GradeTableWrap>
                    <GradeTable>
                      <thead>
                        <tr>
                          <GTh width="55%">Grade / Size</GTh>
                          <GTh width="25%" align="right">Count</GTh>
                          <GTh width="20%" align="right">Share</GTh>
                        </tr>
                      </thead>
                      <tbody>
                        {(sample.grades || []).map((g, gi) => (
                          <GTr key={gi}>
                            <GTd><GradeBadge>{g.grade}</GradeBadge></GTd>
                            <GTd align="right"><PcBadge>{g.count} pc</PcBadge></GTd>
                            <GTd align="right" style={{ color: '#888', fontSize: '0.72rem' }}>
                              {totalPc > 0 ? `${((g.count / totalPc) * 100).toFixed(1)}%` : '—'}
                            </GTd>
                          </GTr>
                        ))}
                      </tbody>
                      <tfoot>
                        <GradeTotalRow>
                          <GTd>Total</GTd>
                          <GTd align="right">{totalPc} pc</GTd>
                          <GTd align="right">100%</GTd>
                        </GradeTotalRow>
                      </tfoot>
                    </GradeTable>
                  </GradeTableWrap>
                </SampleBody>
              </SampleCard>
            );
          })
        )}
      </Wrapper>
    </Modal>
  );
};

export default RMQCModal;