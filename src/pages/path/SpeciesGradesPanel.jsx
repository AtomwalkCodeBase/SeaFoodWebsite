import { useState, useMemo } from "react";

import { INIT_SPECIES } from "../data/species";
import { INIT_GRADES } from "../data/grades";
import { INIT_YIELD_STEPS } from "../data/yieldSteps";

import Card from "../../../components/ui/Card";
import Field from "../../../components/ui/Field";
import Badge from "../../../components/ui/Badge";
import MiniTable from "../../../components/ui/MiniTable";
import SectionTitle from "../../../components/ui/SectionTitle";

import { T } from "../../../styles/Theme";
import { mono } from "../../../styles/fonts";

export default function SpeciesGradesPanel() {
  const [selSpecies, setSelSpecies] = useState("sp-1");

  const species = useMemo(
    () => INIT_SPECIES.find((s) => s.id === selSpecies),
    [selSpecies]
  );

  const grades = useMemo(
    () => INIT_GRADES.filter((g) => g.species === selSpecies),
    [selSpecies]
  );

  if (!species) return null;

  const baseYield = INIT_YIELD_STEPS.reduce(
    (acc, step) => acc * step.yield_pct,
    1
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      
      {/* 🔹 Species Selector */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {INIT_SPECIES.map((sp) => (
          <button
            key={sp.id}
            onClick={() => setSelSpecies(sp.id)}
            style={{
              padding: "8px 16px",
              border: `1px solid ${
                selSpecies === sp.id ? T.teal : T.border
              }`,
              borderRadius: 8,
              background: selSpecies === sp.id ? T.tealB : T.card,
              color: selSpecies === sp.id ? T.teal : T.dim,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {sp.name}
            <span style={{ fontSize: 10, opacity: 0.7 }}>
              {" "}({sp.category_alias})
            </span>
          </button>
        ))}
      </div>

      {/* 🔹 Species Config */}
      <Card accent={T.teal}>
        <SectionTitle
          icon="🦐"
          title={`${species.name} — species configuration`}
          desc={`${species.scientific} · ERP Category "${species.category_alias}"`}
        />

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Field
            label="Base price per MT"
            value={species.base_price}
            suffix="₹"
            width={150}
          />
          <Field
            label="Processing cost/MT"
            value={species.processing_cost}
            suffix="₹"
            width={150}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, color: T.dim }}>
              Certifications
            </span>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {species.certifications.map((cert) => (
                <Badge key={cert} color={T.green} bg={T.greenB}>
                  {cert}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 🔹 Grades Table */}
      <Card>
        <SectionTitle
          icon="📐"
          title="Grade configuration"
          desc="Pricing & yield multipliers drive planning logic"
        />

        <MiniTable
          headers={[
            "Grade",
            "Label",
            "Count/lb",
            "Price Mult",
            "RM Cost",
            "Yield Mult",
            "Eff Yield %",
            "Margin",
          ]}
          rows={grades.map((g) => {
            const rmCost = species.base_price * g.priceMult;
            const totalYield = baseYield * g.yieldMult;
            const margin = 750000 - rmCost - species.processing_cost;

            return [
              <span style={{ fontFamily: mono, fontWeight: 700, color: T.blue }}>
                {g.code}
              </span>,
              g.label,
              <span style={{ fontFamily: mono }}>
                {g.min}–{g.max}
              </span>,
              <span style={{ fontFamily: mono }}>
                {g.priceMult.toFixed(2)}
              </span>,
              <span style={{ fontFamily: mono }}>
                ₹{(rmCost / 1000).toFixed(0)}K
              </span>,
              <span style={{ fontFamily: mono }}>
                {g.yieldMult.toFixed(2)}
              </span>,
              <span style={{ fontFamily: mono }}>
                {(totalYield * 100).toFixed(1)}%
              </span>,
              <span
                style={{
                  fontFamily: mono,
                  fontWeight: 600,
                  color:
                    margin > 150000
                      ? T.green
                      : margin > 0
                      ? T.amber
                      : T.red,
                }}
              >
                ₹{(margin / 1000).toFixed(0)}K
              </span>,
            ];
          })}
        />
      </Card>

      {/* 🔹 Price Comparison Chart */}
      <Card accent={T.purple}>
        <SectionTitle
          icon="💰"
          title="Grade price comparison"
          desc="Relative RM cost per grade"
        />

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 6,
            height: 140,
          }}
        >
          {grades.map((g) => {
            const cost = species.base_price * g.priceMult;
            const maxCost = Math.max(
              ...grades.map((gr) => species.base_price * gr.priceMult)
            );
            const height = (cost / maxCost) * 110;

            return (
              <div
                key={g.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flex: 1,
                }}
              >
                <span style={{ fontSize: 9, fontFamily: mono }}>
                  ₹{(cost / 1000).toFixed(0)}K
                </span>

                <div
                  style={{
                    width: 30,
                    height,
                    background: `linear-gradient(to top, ${T.purple}, ${T.blue})`,
                    borderRadius: "4px 4px 0 0",
                  }}
                />

                <span style={{ fontSize: 10 }}>{g.code}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}