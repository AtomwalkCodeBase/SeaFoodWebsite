import React from "react"
import styled from "styled-components"

const TableWrap = styled.div`
  overflow-x: auto;
  background: ${({ theme, color }) => color ? `${theme.colors[color]}` : theme.colors.background};
  border-radius: 8px;
  padding: 0.4rem;
  min-height: 140px;
`

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 800px;
  color: ${({ theme }) => theme.colors.text};
`

const Th = styled.th`
  text-align: left;
  background: ${({ theme }) => theme.colors.backgroundAlt};
  padding: 0.75rem;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.text};
`

// const Td = styled.td`
//   padding: 0.75rem;
//   border-bottom: 1px solid ${({ theme }) => theme.colors.border};
//   font-size: 0.85rem;
//   color: ${({ theme }) => theme.colors.text};
// `

const Td = ({ children, className = "", ...props }) => {
  return (
    <td
      className={`p-3 border-b border-border text-sm ${className}`.trim()}
      {...props}
    >
      {children}
    </td>
  )
}

function DataTable({ columns, data, renderRow, expandedRow, renderExpandedRow, emptyMessage = "No data available", emptyMessageClassName = "", isLoading = false }) {
  const safeData = Array.isArray(data) ? data : [];
  const hasData = safeData.length > 0;
  const columnsCount = Array.isArray(columns) && columns.length > 0 ? columns.length : 1;

  return (
    <TableWrap>
      <Table>
        <thead>
          <tr>
            {columns?.map((col, index) => (
              <Th key={index}>{col}</Th>
            ))}
          </tr>
        </thead>

        <tbody>
          {isLoading ? (
            <tr>
              <td
                colSpan={columnsCount}
                className={`text-center py-8 text-text-light font-semibold ${emptyMessageClassName}`}
              >
                loading...
              </td>
            </tr>
          ) : hasData ? (
            safeData.map((row, index) => (
              <React.Fragment key={row?.id ?? index}>
                <tr>
                  {renderRow(row)}
                </tr>

                {expandedRow === row?.id && renderExpandedRow && (
                  <tr>
                    <td colSpan={columnsCount}>
                      {renderExpandedRow(row)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          ) : (
            <tr>
              <td
                colSpan={columnsCount}
                className={`text-center py-8 text-text-light font-semibold ${emptyMessageClassName}`}
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </TableWrap>
  )
}

export { Td }
export default DataTable