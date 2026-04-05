/**
 * Generates and downloads an ICS calendar file for an incomplete service report.
 */
export function downloadIncompleteReportICS({ reportNumber, customerName, customerAddress, customerCity, date, problemDescription, technicianName }) {
  const reportDate = date ? new Date(date + "T09:00:00") : new Date();
  const endDate = new Date(reportDate.getTime() + 60 * 60 * 1000); // 1 hour default

  const formatICSDate = (d) => {
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  };

  const escapeICS = (str) => (str || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

  const location = [customerAddress, customerCity].filter(Boolean).join(", ");
  const description = [
    `Report #${reportNumber || "N/A"}`,
    `Customer: ${customerName || "N/A"}`,
    technicianName ? `Technician: ${technicianName}` : "",
    `Status: Incomplete`,
    problemDescription ? `\\nProblem: ${problemDescription}` : "",
  ].filter(Boolean).join("\\n");

  const now = formatICSDate(new Date());
  const uid = `report-${reportNumber || Date.now()}@icstek`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ICS Service Reports//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatICSDate(reportDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `SUMMARY:${escapeICS(`Follow-up: Report #${reportNumber} - ${customerName}`)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    location ? `LOCATION:${escapeICS(location)}` : "",
    "STATUS:CONFIRMED",
    `CATEGORIES:Service Report,Incomplete`,
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    `DESCRIPTION:Reminder: Incomplete service report #${reportNumber}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `report-${reportNumber || "new"}-followup.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}