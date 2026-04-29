import React from "react"
import styled from "styled-components"

const TableWrap = styled.div`
  overflow-x: auto;
  background: white;
  border-radius: 8px;
  padding: 0.4rem;
`

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 800px;
`

const Th = styled.th`
  text-align: left;
  background: ${({ theme }) => theme.colors.backgroundAlt};
  padding: 0.75rem;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.text};
`

const Td = styled.td`
  padding: 0.75rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.text};
`

function DataTable({ columns, data, renderRow, expandedRow, renderExpandedRow }) {
  return (
    <TableWrap>
      <Table>
        <thead>
          <tr>
            {columns.map((col, index) => (
              <Th key={index}>{col}</Th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row) => (
            <React.Fragment key={row.id}>
              
              {/* Main Row */}
              <tr>
                {renderRow(row)}
              </tr>

              {/* Expanded Row */}
              {expandedRow === row.id && renderExpandedRow && (
                <tr>
                  <td colSpan={columns.length}>
                    {renderExpandedRow(row)}
                  </td>
                </tr>
              )}

            </React.Fragment>
          ))}
        </tbody>
      </Table>
    </TableWrap>
  )
}

export { Td }
export default DataTable