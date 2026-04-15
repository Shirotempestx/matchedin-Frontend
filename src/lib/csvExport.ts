export function downloadCSV(data: any[], filename: string) {
    if (!data || !data.length) return;

    // Get all unique headers from the objects
    const headers = Array.from(new Set(data.flatMap(Object.keys)));
    
    // Create CSV rows
    const csvRows = [];
    
    // Add header row
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of data) {
        const values = headers.map(header => {
            const val = row[header];
            // Format object/array to string, escape quotes
            if (val === null || val === undefined) {
                return '';
            } else if (typeof val === 'object') {
                return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
            } else {
                return `"${String(val).replace(/"/g, '""')}"`;
            }
        });
        csvRows.push(values.join(','));
    }
    
    // Combine to single string
    const csvString = csvRows.join('\n');
    
    // Create download link
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
