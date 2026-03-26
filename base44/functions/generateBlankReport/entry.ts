import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;
    let yPos = margin;
    const lineHeight = 7;

    // Helper function to add a text field
    const addTextField = (label, width, height = 8) => {
      pdf.setFontSize(9);
      pdf.text(label, margin, yPos);
      yPos += 4;
      pdf.rect(margin, yPos, width, height);
      yPos += height + 3;
    };

    // Helper function to add a two-column layout
    const addTwoColumnFields = (label1, label2) => {
      pdf.setFontSize(9);
      const colWidth = (contentWidth - 2) / 2;
      
      pdf.text(label1, margin, yPos);
      pdf.text(label2, margin + colWidth + 2, yPos);
      yPos += 4;
      
      pdf.rect(margin, yPos, colWidth, 8);
      pdf.rect(margin + colWidth + 2, yPos, colWidth, 8);
      yPos += 11;
    };

    // Header
    pdf.setFontSize(16);
    pdf.text('SERVICE REPORT', margin, yPos);
    yPos += 8;

    // Company info
    pdf.setFontSize(8);
    pdf.text('ICS, INC | 6038 Tampa Ave., Tarzana, CA 91356 | (818) 609-7648 | service@icstek.com', margin, yPos);
    yPos += 5;

    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;

    // Report Number and Date
    addTwoColumnFields('Report #:', 'Date:');

    // Report Type and Status
    addTwoColumnFields('Report Type (Repair/Estimate):', 'Status (Complete/Incomplete):');

    // Customer Section
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.text('CUSTOMER INFORMATION', margin, yPos);
    yPos += 6;
    pdf.setFont(undefined, 'normal');

    addTextField('Customer Name:', contentWidth);
    addTextField('Address:', contentWidth);

    const colWidth = (contentWidth - 2) / 3;
    pdf.setFontSize(9);
    pdf.text('City:', margin, yPos);
    pdf.text('Zip:', margin + colWidth + 2, yPos);
    pdf.text('Tel:', margin + (colWidth + 2) * 2, yPos);
    yPos += 4;
    pdf.rect(margin, yPos, colWidth, 8);
    pdf.rect(margin + colWidth + 2, yPos, colWidth, 8);
    pdf.rect(margin + (colWidth + 2) * 2, yPos, colWidth, 8);
    yPos += 11;

    addTextField('Cell Phone:', contentWidth);
    addTextField('Email:', contentWidth);

    // Equipment Section
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.text('EQUIPMENT INFORMATION', margin, yPos);
    yPos += 6;
    pdf.setFont(undefined, 'normal');

    addTextField('Equipment Received:', contentWidth);
    addTextField('Equipment Model:', contentWidth);
    addTextField('Equipment Serial #:', contentWidth);

    // Problem Description
    pdf.setFontSize(9);
    pdf.text('Problem Description:', margin, yPos);
    yPos += 4;
    pdf.rect(margin, yPos, contentWidth, 20);
    yPos += 23;

    // Technician Section
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.text('TECHNICIAN & LABOR', margin, yPos);
    yPos += 6;
    pdf.setFont(undefined, 'normal');

    addTwoColumnFields('Technician Name:', 'Hourly Rate:');
    addTwoColumnFields('Time Arrive:', 'Time Left:');
    addTextField('Total Hours Worked:', contentWidth);

    // Service Description
    pdf.setFontSize(9);
    pdf.text('Service Description:', margin, yPos);
    yPos += 4;
    pdf.rect(margin, yPos, contentWidth, 20);
    yPos += 23;

    // Parts Section
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.text('PARTS REPLACED', margin, yPos);
    yPos += 6;
    pdf.setFont(undefined, 'normal');

    // Table header
    pdf.setFontSize(8);
    const colWidths = [80, 20, 30, 30];
    let xPos = margin;
    
    pdf.rect(xPos, yPos, colWidths[0], 6);
    pdf.text('Part Name', xPos + 2, yPos + 4);
    xPos += colWidths[0];
    
    pdf.rect(xPos, yPos, colWidths[1], 6);
    pdf.text('Qty', xPos + 5, yPos + 4);
    xPos += colWidths[1];
    
    pdf.rect(xPos, yPos, colWidths[2], 6);
    pdf.text('Unit Cost', xPos + 5, yPos + 4);
    xPos += colWidths[2];
    
    pdf.rect(xPos, yPos, colWidths[3], 6);
    pdf.text('Total', xPos + 10, yPos + 4);
    yPos += 6;

    // Empty rows for parts (4 rows)
    for (let i = 0; i < 4; i++) {
      xPos = margin;
      pdf.rect(xPos, yPos, colWidths[0], 8);
      xPos += colWidths[0];
      pdf.rect(xPos, yPos, colWidths[1], 8);
      xPos += colWidths[1];
      pdf.rect(xPos, yPos, colWidths[2], 8);
      xPos += colWidths[2];
      pdf.rect(xPos, yPos, colWidths[3], 8);
      yPos += 8;
    }

    yPos += 3;

    // Charges Section
    pdf.setFontSize(9);
    const chargesX = pageWidth - margin - 70;
    const chargesWidth = 60;

    pdf.text('Labor Charge:', chargesX - 20, yPos);
    pdf.rect(chargesX, yPos - 3, chargesWidth, 6);
    yPos += 8;

    pdf.text('Parts Charge:', chargesX - 20, yPos);
    pdf.rect(chargesX, yPos - 3, chargesWidth, 6);
    yPos += 8;

    pdf.text('Travel Charge:', chargesX - 20, yPos);
    pdf.rect(chargesX, yPos - 3, chargesWidth, 6);
    yPos += 8;

    pdf.text('Misc Charge:', chargesX - 20, yPos);
    pdf.rect(chargesX, yPos - 3, chargesWidth, 6);
    yPos += 8;

    pdf.setFont(undefined, 'bold');
    pdf.text('Sub Total:', chargesX - 20, yPos);
    pdf.rect(chargesX, yPos - 3, chargesWidth, 6);
    yPos += 8;

    pdf.text('Tax Rate (%):', chargesX - 20, yPos);
    pdf.rect(chargesX, yPos - 3, chargesWidth, 6);
    yPos += 8;

    pdf.text('Tax Amount:', chargesX - 20, yPos);
    pdf.rect(chargesX, yPos - 3, chargesWidth, 6);
    yPos += 10;

    pdf.setFontSize(11);
    pdf.text('TOTAL:', chargesX - 20, yPos);
    pdf.rect(chargesX, yPos - 3, chargesWidth, 8);
    
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