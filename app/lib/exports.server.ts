// Export utilities for CSV, Excel, and PDF

export function generateCSV(headers: string[], rows: any[][]): string {
  const csvHeaders = headers.join(',');
  const csvRows = rows.map(row =>
    row.map(field => {
      // Escape quotes and wrap in quotes if contains comma or quote
      const stringField = String(field ?? '');
      if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
    }).join(',')
  );

  return [csvHeaders, ...csvRows].join('\n');
}

export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

// Excel export using simple XML format (compatible with xlsx library)
export function generateExcelXML(headers: string[], rows: any[][], sheetName: string = 'Sheet1'): string {
  const xmlRows = rows.map(row => {
    const cells = row.map(cell => {
      const value = String(cell ?? '');
      const isNumber = !isNaN(Number(value)) && value !== '';
      return `<Cell><Data ss:Type="${isNumber ? 'Number' : 'String'}">${escapeXml(value)}</Data></Cell>`;
    }).join('');
    return `<Row>${cells}</Row>`;
  }).join('');

  const headerRow = `<Row>${headers.map(h => `<Cell ss:StyleID="header"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`).join('')}</Row>`;

  return `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="header">
   <Font ss:Bold="1"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${escapeXml(sheetName)}">
  <Table>
   ${headerRow}
   ${xmlRows}
  </Table>
 </Worksheet>
</Workbook>`;
}

export function excelResponse(xml: string, filename: string): Response {
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/vnd.ms-excel',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
