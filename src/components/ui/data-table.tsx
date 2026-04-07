import { Surface } from "@/components/ui/surface";

import styles from "./data-table.module.css";

type DataTableProps = {
  columns: readonly string[];
  rows: Array<{
    cells: readonly [string, string, string];
    id: string;
  }>;
};

export function DataTable({ columns, rows }: DataTableProps) {
  return (
    <Surface className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th className={styles.headCell} key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className={styles.row} key={row.id}>
              <td className={styles.cellPrimary}>{row.cells[0]}</td>
              <td className={styles.cellSecondary}>{row.cells[1]}</td>
              <td className={styles.metric}>{row.cells[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Surface>
  );
}
