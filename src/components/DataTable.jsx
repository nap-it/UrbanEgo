export default function DataTable({ label, columns, rows }) {
  return (
    <div className="site-table-wrap schema-table-wrap">
      <table className="site-table schema-table" role="table" aria-label={label}>
        <colgroup>
          {columns.map((column) => <col key={column.label} style={{ width: column.width }} />)}
        </colgroup>
        <thead role="rowgroup">
          <tr role="row">
            {columns.map((column) => <th key={column.label} scope="col" role="columnheader">{column.label}</th>)}
          </tr>
        </thead>
        <tbody role="rowgroup">
          {rows.map((row) => (
            <tr key={row[0]} role="row">
              {row.map((value, index) => index === 0 ? (
                <th key={columns[index].label} className={`row-identity${columns[index].mono ? ' mono' : ''}`} scope="row" role="rowheader">{value}</th>
              ) : (
                <td key={columns[index].label} role="cell">
                  <span className="mobile-column-label" aria-hidden="true">{columns[index].label}</span>
                  <div className={`cell-value${columns[index].mono ? ' mono' : ''}`}>{value}</div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
