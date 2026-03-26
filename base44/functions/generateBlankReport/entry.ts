import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'letter');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 8;
    const contentWidth = pageWidth - margin * 2;
    let yPos = margin;
    const labelWidth = 28;

    // Helper function to add a text field with label
    const addTextField = (label, width, height = 6) => {
      pdf.setFontSize(8);
      const labelX = margin;
      const boxX = margin + labelWidth;
      const boxWidth = width - labelWidth;
      
      pdf.text(label, labelX, yPos + 1);
      pdf.rect(boxX, yPos, boxWidth, height);
      yPos += height + 2;
    };

    // Helper function to add a two-column layout
    const addTwoColumnFields = (label1, label2) => {
      pdf.setFontSize(8);
      const col1Width = (contentWidth - 2) / 2;
      const col2Width = col1Width;
      
      pdf.text(label1, margin, yPos + 1);
      pdf.text(label2, margin + col1Width + 2, yPos + 1);
      yPos += 3;
      
      pdf.rect(margin + labelWidth, yPos - 2, col1Width - labelWidth, 6);
      pdf.rect(margin + col1Width + 2 + labelWidth, yPos - 2, col2Width - labelWidth, 6);
      yPos += 7;
    };

    // Header
    pdf.setFontSize(14);
    pdf.text('SERVICE REPORT', margin, yPos);
    yPos += 6;

    // Company info
    pdf.setFontSize(7);
    pdf.text('ICS, INC | 6038 Tampa Ave., Tarzana, CA 91356 | (818) 609-7648 | service@icstek.com', margin, yPos);
    yPos += 3;

    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 3;

    // Report Number and Date
    pdf.setFontSize(8);
    const col1Width = (contentWidth - 2) / 2;
    pdf.text('Report #:', margin, yPos + 1);
    pdf.text('Date:', margin + col1Width + 2, yPos + 1);
    yPos += 3;
    pdf.rect(margin + labelWidth, yPos, col1Width - labelWidth, 6);
    pdf.rect(margin + col1Width + 2 + labelWidth, yPos, col1Width - labelWidth, 6);
    yPos += 8;

    // Report Type and Status
    pdf.text('Report Type:', margin, yPos + 1);
    pdf.text('Status:', margin + col1Width + 2, yPos + 1);
    yPos += 3;
    pdf.rect(margin + labelWidth, yPos, col1Width - labelWidth, 6);
    pdf.rect(margin + col1Width + 2 + labelWidth, yPos, col1Width - labelWidth, 6);
    yPos += 8;

    // Customer Section
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'bold');
    pdf.text('CUSTOMER', margin, yPos);
    yPos += 4;
    pdf.setFont(undefined, 'normal');

    addTextField('Name:', contentWidth);
    addTextField('Address:', contentWidth);

    const col3Width = (contentWidth - 4) / 3;
    pdf.setFontSize(8);
    pdf.text('City:', margin, yPos + 1);
    pdf.text('Zip:', margin + col3Width + 2, yPos + 1);
    pdf.text('Tel:', margin + (col3Width + 2) * 2, yPos + 1);
    yPos += 3;
    pdf.rect(margin + 16, yPos, col3Width - 16, 6);
    pdf.rect(margin + col3Width + 2 + 16, yPos, col3Width - 16, 6);
    pdf.rect(margin + (col3Width + 2) * 2 + 16, yPos, col3Width - 16, 6);
    yPos += 8;

    addTextField('Cell:', contentWidth);
    addTextField('Email:', contentWidth);

    // Items Received
    pdf.setFontSize(8);
    pdf.text('Items Received:', margin, yPos);
    pdf.text('☐Computer  ☐Printer  ☐Laptop  ☐Screen  ☐Other', margin + 30, yPos);
    yPos += 4;

    // Equipment Section
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'bold');
    pdf.text('EQUIPMENT', margin, yPos);
    yPos += 4;
    pdf.setFont(undefined, 'normal');

    addTextField('Received:', contentWidth);
    addTextField('Model:', contentWidth);
    addTextField('Serial #:', contentWidth);

    // Problem Description
    pdf.setFontSize(8);
    pdf.text('Problem:', margin, yPos);
    yPos += 3;
    pdf.rect(margin, yPos, contentWidth, 10);
    yPos += 12;

    // Technician Section
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'bold');
    pdf.text('LABOR', margin, yPos);
    yPos += 4;
    pdf.setFont(undefined, 'normal');

    pdf.setFontSize(8);
    pdf.text('Technician:', margin, yPos + 1);
    pdf.text('Rate:', margin + col1Width + 2, yPos + 1);
    yPos += 3;
    pdf.rect(margin + labelWidth, yPos, col1Width - labelWidth, 6);
    pdf.rect(margin + col1Width + 2 + labelWidth, yPos, col1Width - labelWidth, 6);
    yPos += 8;

    pdf.text('Arrive:', margin, yPos + 1);
    pdf.text('Left:', margin + col1Width + 2, yPos + 1);
    yPos += 3;
    pdf.rect(margin + labelWidth, yPos, col1Width - labelWidth, 6);
    pdf.rect(margin + col1Width + 2 + labelWidth, yPos, col1Width - labelWidth, 6);
    yPos += 8;

    pdf.text('Wait Hours:', margin, yPos + 1);
    pdf.text('Total Hours:', margin + col1Width + 2, yPos + 1);
    yPos += 3;
    pdf.rect(margin + labelWidth, yPos, col1Width - labelWidth, 6);
    pdf.rect(margin + col1Width + 2 + labelWidth, yPos, col1Width - labelWidth, 6);
    yPos += 8;

    addTextField('Password:', contentWidth);

    // Service Description
    pdf.setFontSize(8);
    pdf.text('Service:', margin, yPos);
    yPos += 3;
    pdf.rect(margin, yPos, contentWidth, 8);
    yPos += 10;

    // Parts Section
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'bold');
    pdf.text('PARTS', margin, yPos);
    yPos += 4;
    pdf.setFont(undefined, 'normal');

    // Table header
    pdf.setFontSize(7);
    const colWidths = [60, 15, 25, 25];
    let xPos = margin;
    
    pdf.rect(xPos, yPos, colWidths[0], 4);
    pdf.text('Part', xPos + 1, yPos + 3);
    xPos += colWidths[0];
    
    pdf.rect(xPos, yPos, colWidths[1], 4);
    pdf.text('Qty', xPos + 3, yPos + 3);
    xPos += colWidths[1];
    
    pdf.rect(xPos, yPos, colWidths[2], 4);
    pdf.text('Cost', xPos + 3, yPos + 3);
    xPos += colWidths[2];
    
    pdf.rect(xPos, yPos, colWidths[3], 4);
    pdf.text('Total', xPos + 5, yPos + 3);
    yPos += 4;

    // Empty rows for parts (2 rows)
    for (let i = 0; i < 2; i++) {
      xPos = margin;
      pdf.rect(xPos, yPos, colWidths[0], 5);
      xPos += colWidths[0];
      pdf.rect(xPos, yPos, colWidths[1], 5);
      xPos += colWidths[1];
      pdf.rect(xPos, yPos, colWidths[2], 5);
      xPos += colWidths[2];
      pdf.rect(xPos, yPos, colWidths[3], 5);
      yPos += 5;
    }

    yPos += 2;

    // Charges Section
    pdf.setFontSize(8);
    const chargesX = pageWidth - margin - 50;
    const chargesWidth = 45;

    pdf.text('Labor:', chargesX - 15, yPos);
    pdf.rect(chargesX, yPos - 2, chargesWidth, 4);
    yPos += 5;

    pdf.text('Parts:', chargesX - 15, yPos);
    pdf.rect(chargesX, yPos - 2, chargesWidth, 4);
    yPos += 5;

    pdf.text('Travel:', chargesX - 15, yPos);
    pdf.rect(chargesX, yPos - 2, chargesWidth, 4);
    yPos += 5;

    pdf.text('Misc:', chargesX - 15, yPos);
    pdf.rect(chargesX, yPos - 2, chargesWidth, 4);
    yPos += 5;

    pdf.setFont(undefined, 'bold');
    pdf.text('Sub Total:', chargesX - 15, yPos);
    pdf.rect(chargesX, yPos - 2, chargesWidth, 4);
    yPos += 5;

    pdf.text('Tax %:', chargesX - 15, yPos);
    pdf.rect(chargesX, yPos - 2, chargesWidth, 4);
    yPos += 5;

    pdf.text('Tax:', chargesX - 15, yPos);
    pdf.rect(chargesX, yPos - 2, chargesWidth, 4);
    yPos += 6;

    pdf.setFontSize(10);
    pdf.text('TOTAL:', chargesX - 15, yPos);
    pdf.rect(chargesX, yPos - 2, chargesWidth, 6);

    // Add form fields to make PDF editable
    const fields = [
      { name: 'reportNum', x: margin + labelWidth, y: margin + 15, w: col1Width - labelWidth, h: 6 },
      { name: 'date', x: margin + col1Width + 2 + labelWidth, y: margin + 15, w: col1Width - labelWidth, h: 6 },
    ];

    // Convert PDF to blob and return
    const pdfBlob = pdf.output('blob');
    
    return new Response(pdfBlob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="blank-report.pdf"'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});