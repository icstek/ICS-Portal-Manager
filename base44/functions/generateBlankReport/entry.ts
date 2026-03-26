import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'letter');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 8;
    const contentWidth = pageWidth - margin * 2;
    let yPos = margin;

    // Helper function to add a text field
    const addTextField = (label, width, height = 5) => {
      pdf.setFontSize(8);
      pdf.text(label, margin, yPos);
      yPos += 3;
      pdf.rect(margin, yPos, width, height);
      yPos += height + 1;
    };

    // Helper function to add a two-column layout
    const addTwoColumnFields = (label1, label2) => {
      pdf.setFontSize(8);
      const colWidth = (contentWidth - 2) / 2;
      
      pdf.text(label1, margin, yPos);
      pdf.text(label2, margin + colWidth + 2, yPos);
      yPos += 3;
      
      pdf.rect(margin, yPos, colWidth, 5);
      pdf.rect(margin + colWidth + 2, yPos, colWidth, 5);
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
    addTwoColumnFields('Report #:', 'Date:');

    // Report Type and Status
    addTwoColumnFields('Report Type:', 'Status:');

    // Customer Section
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'bold');
    pdf.text('CUSTOMER', margin, yPos);
    yPos += 4;
    pdf.setFont(undefined, 'normal');

    addTextField('Name:', contentWidth);
    addTextField('Address:', contentWidth);

    const colWidth = (contentWidth - 2) / 3;
    pdf.setFontSize(8);
    pdf.text('City:', margin, yPos);
    pdf.text('Zip:', margin + colWidth + 2, yPos);
    pdf.text('Tel:', margin + (colWidth + 2) * 2, yPos);
    yPos += 3;
    pdf.rect(margin, yPos, colWidth, 5);
    pdf.rect(margin + colWidth + 2, yPos, colWidth, 5);
    pdf.rect(margin + (colWidth + 2) * 2, yPos, colWidth, 5);
    yPos += 7;

    addTextField('Cell:', contentWidth);
    addTextField('Email:', contentWidth);

    // Items Received
    pdf.setFontSize(8);
    pdf.text('Items Received: □Computer □Printer □Laptop □Screen □Other', margin, yPos);
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

    addTwoColumnFields('Technician:', 'Rate:');
    addTwoColumnFields('Arrive:', 'Left:');
    addTwoColumnFields('Wait Hours:', 'Total Hours:');
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