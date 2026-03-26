import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'letter');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;
    let yPos = margin;

    // Helper to add section title
    const addSectionTitle = (title) => {
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'bold');
      pdf.text(title, margin, yPos);
      yPos += 4;
      pdf.setFont(undefined, 'normal');
    };

    // Helper to add a single field with label on left
    const addField = (label, boxHeight = 6) => {
      pdf.setFontSize(8);
      yPos += 2;
      pdf.text(label, margin, yPos);
      pdf.rect(margin, yPos + 3, contentWidth, boxHeight);
      yPos += boxHeight + 4;
    };

    // Helper to add two fields side by side
    const addTwoFields = (label1, label2) => {
      pdf.setFontSize(8);
      const colWidth = (contentWidth - 2) / 2;
      
      yPos += 2;
      pdf.text(label1, margin, yPos);
      pdf.text(label2, margin + colWidth + 2, yPos);
      pdf.rect(margin, yPos + 3, colWidth, 6);
      pdf.rect(margin + colWidth + 2, yPos + 3, colWidth, 6);
      yPos += 11;
    };

    // Helper to add three fields
    const addThreeFields = (label1, label2, label3) => {
      pdf.setFontSize(8);
      const colWidth = (contentWidth - 4) / 3;
      
      yPos += 2;
      pdf.text(label1, margin, yPos);
      pdf.text(label2, margin + colWidth + 2, yPos);
      pdf.text(label3, margin + (colWidth + 2) * 2, yPos);
      pdf.rect(margin, yPos + 3, colWidth, 6);
      pdf.rect(margin + colWidth + 2, yPos + 3, colWidth, 6);
      pdf.rect(margin + (colWidth + 2) * 2, yPos + 3, colWidth, 6);
      yPos += 11;
    };

    // Helper to add four fields
    const addFourFields = (label1, label2, label3, label4) => {
      pdf.setFontSize(8);
      const colWidth = (contentWidth - 6) / 4;
      
      yPos += 2;
      pdf.text(label1, margin, yPos);
      pdf.text(label2, margin + colWidth + 2, yPos);
      pdf.text(label3, margin + (colWidth + 2) * 2, yPos);
      pdf.text(label4, margin + (colWidth + 2) * 3, yPos);
      pdf.rect(margin, yPos + 3, colWidth, 6);
      pdf.rect(margin + colWidth + 2, yPos + 3, colWidth, 6);
      pdf.rect(margin + (colWidth + 2) * 2, yPos + 3, colWidth, 6);
      pdf.rect(margin + (colWidth + 2) * 3, yPos + 3, colWidth, 6);
      yPos += 11;
    };

    // HEADER
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('SERVICE REPORT', margin, yPos);
    yPos += 5;

    // REPORT INFO
    addTwoFields('Report #:', 'Date:');
    yPos += 2;

    // CUSTOMER SECTION
    addSectionTitle('CUSTOMER');
    addTwoFields('Name:', 'Address:');
    addThreeFields('City:', 'Zip:', 'Tel:');
    addTwoFields('Cell:', 'Email:');
    
    pdf.setFontSize(8);
    pdf.text('Items Received:', margin, yPos + 1.5);
    pdf.text('[ ] Computer   [ ] Printer   [ ] Laptop   [ ] Screen   [ ] Other', margin + 35, yPos + 1.5);
    yPos += 4;
    yPos += 4;

    // EQUIPMENT SECTION
    addSectionTitle('EQUIPMENT');
    addThreeFields('Received Item:', 'Model:', 'Serial #:');
    addField('Problem Description:', 6);
    yPos += 4;

    // LABOR SECTION
    addSectionTitle('LABOR');
    addThreeFields('Technician:', 'Arrive Time:', 'Left Time:');
    addThreeFields('Wait Hours:', 'Rate:', 'Total Hours:');
    addField('Password:');
    yPos += 4;

    // SERVICE DESCRIPTION
    pdf.setFontSize(8);
    yPos += 2;
    pdf.text('Service Description:', margin, yPos);
    pdf.rect(margin, yPos + 3, contentWidth, 5);
    yPos += 12;

    // PARTS SECTION
    addSectionTitle('PARTS');
    const tableY = yPos;
    const colWidths = [contentWidth * 0.5, contentWidth * 0.15, contentWidth * 0.17, contentWidth * 0.18];
    
    pdf.setFontSize(8);
    pdf.setFont(undefined, 'bold');
    pdf.text('Part', margin + 1, tableY + 3);
    pdf.text('Qty', margin + colWidths[0] + 1, tableY + 3);
    pdf.text('Cost', margin + colWidths[0] + colWidths[1] + 1, tableY + 3);
    pdf.text('Total', margin + colWidths[0] + colWidths[1] + colWidths[2] + 1, tableY + 3);
    
    pdf.rect(margin, tableY, colWidths[0], 5);
    pdf.rect(margin + colWidths[0], tableY, colWidths[1], 5);
    pdf.rect(margin + colWidths[0] + colWidths[1], tableY, colWidths[2], 5);
    pdf.rect(margin + colWidths[0] + colWidths[1] + colWidths[2], tableY, colWidths[3], 5);

    // One empty row for parts
    const rowY = tableY + 5;
    pdf.rect(margin, rowY, colWidths[0], 5);
    pdf.rect(margin + colWidths[0], rowY, colWidths[1], 5);
    pdf.rect(margin + colWidths[0] + colWidths[1], rowY, colWidths[2], 5);
    pdf.rect(margin + colWidths[0] + colWidths[1] + colWidths[2], rowY, colWidths[3], 5);

    yPos = tableY + 10;
    yPos += 4;

    // CHARGES SECTION
    const chargesX = margin + contentWidth * 0.6;
    const chargesWidth = contentWidth * 0.35;
    const labelWidth = 25;
    
    pdf.setFontSize(8);
    pdf.setFont(undefined, 'normal');
    
    const chargeLabels = ['Labor:', 'Parts:', 'Travel:', 'Misc:', 'Sub Total:', 'Tax %:', 'Tax:', 'TOTAL:'];
    let chargeY = yPos;
    
    chargeLabels.forEach((label) => {
      pdf.rect(chargesX, chargeY, chargesWidth, 5);
      pdf.text(label, chargesX - 2, chargeY + 3.5, { align: 'right' });
      chargeY += 6;
    });

    // TERMS OF SERVICE SECTION
    yPos = chargeY + 4;
    pdf.setFontSize(6.5);
    pdf.setFont(undefined, 'bold');
    pdf.text('Terms & Conditions:', margin, yPos);
    yPos += 2;
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(5);
    const tosText = "The service and repair estimates indicated herein are hereby acceptable to the undersigned. Items not picked up within 30 calendar days from the date below will be subject to sale in order to recover ICS expenses. Customer understands that ICS is not responsible for loss or damage to any equipment in case of fire, theft, or any other causes beyond ICS control.";
    pdf.text(tosText, margin, yPos, { maxWidth: contentWidth, align: 'left' });
    yPos += 10;

    // SIGNATURE SECTION
    pdf.setFontSize(8);
    pdf.setFont(undefined, 'normal');
    pdf.text('Technician Signature:', margin, yPos);
    pdf.rect(margin, yPos + 3, contentWidth * 0.5, 15);
    
    pdf.text('Date:', margin + contentWidth * 0.5 + 5, yPos);
    pdf.rect(margin + contentWidth * 0.5 + 15, yPos + 3, contentWidth * 0.5 - 20, 15);

    const pdfBlob = pdf.output('blob');
    
    return new Response(pdfBlob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=service_report_blank.pdf'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});